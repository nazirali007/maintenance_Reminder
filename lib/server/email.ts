import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import { getModelImagePath } from "@/lib/car-catalog";

interface EmailAttachment {
  filename: string;
  content: Buffer;
  cid: string;
}

/**
 * Embeds the car photo directly in the email (CID inline attachment) rather
 * than linking to a URL on our server. A linked URL either points at
 * localhost in dev (unreachable by any real mail client) or, even once
 * deployed, gets silently blocked by the "don't load remote images"
 * default most mail clients (Gmail, Outlook) ship with.
 */
async function loadCarPhotoAttachment(
  brand: string,
  model: string,
  cid: string
): Promise<EmailAttachment | null> {
  const imagePath = getModelImagePath(brand, model);
  if (!imagePath) return null;

  const relativePath = decodeURIComponent(imagePath.replace(/^\//, ""));
  const absolutePath = path.join(process.cwd(), "public", relativePath);

  try {
    const content = await readFile(absolutePath);
    return { filename: path.basename(absolutePath), content, cid };
  } catch {
    return null;
  }
}

function carPhotoHtml(cid: string, brand: string, model: string): string {
  return `<img src="cid:${cid}" alt="${brand} ${model}" width="480" style="display: block; width: 100%; max-width: 480px; height: auto; border-radius: 12px; margin-bottom: 12px;" />`;
}

let transporter: nodemailer.Transporter | undefined;

function getTransporter() {
  return (transporter ??= nodemailer.createTransport({
    host: "smtp.resend.com",
    port: 465,
    secure: true,
    auth: {
      user: "resend",
      pass: process.env.RESEND_API_KEY,
    },
  }));
}

async function sendMail(
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[] = []
) {
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject,
    html,
    attachments,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendMail(
    to,
    "Reset your password",
    `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `
  );
}

export async function sendOtpEmail(to: string, code: string) {
  await sendMail(
    to,
    `${code} is your sign-in code`,
    `
      <p>Use this code to sign in:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    `
  );
}

export interface MaintenanceDueEntry {
  vehicleLabel: string;
  vehicleBrand: string;
  vehicleModel: string;
  itemName: string;
  reasonKm: boolean;
  reasonDate: boolean;
  dueSoon: boolean;
  /** True for the daily cron's driving-rate projection; false when triggered right after a real odometer reading. */
  isEstimated: boolean;
}

/**
 * One email per run per user summarizing every item that just became due —
 * across all their vehicles — instead of a separate email per item. A user
 * tracking 5 maintenance items that all cross their threshold on the same
 * day gets a single digest, not 5 emails. Grouped by vehicle so each car's
 * photo shows once, above its own list of due items.
 */
export async function sendMaintenanceDueSummaryEmail(
  to: string,
  entries: MaintenanceDueEntry[]
) {
  if (entries.length === 0) return;

  const anyOverdue = entries.some((e) => !e.dueSoon);
  const subject =
    entries.length === 1
      ? `${entries[0].itemName} ${entries[0].dueSoon ? "will be due soon" : "may be due"} — ${entries[0].vehicleLabel}`
      : anyOverdue
        ? `${entries.length} maintenance items may be due`
        : `${entries.length} maintenance items due soon`;

  const vehicleGroups = new Map<string, MaintenanceDueEntry[]>();
  for (const entry of entries) {
    const group = vehicleGroups.get(entry.vehicleLabel);
    if (group) {
      group.push(entry);
    } else {
      vehicleGroups.set(entry.vehicleLabel, [entry]);
    }
  }

  const attachments: EmailAttachment[] = [];

  const sections = await Promise.all(
    [...vehicleGroups.entries()].map(async ([vehicleLabel, vehicleEntries], index) => {
      const items = vehicleEntries
        .map((e) => {
          const verb = e.dueSoon ? "will be due soon" : "may be due";
          const reasons = [
            e.reasonKm &&
              (e.dueSoon
                ? "estimated mileage is approaching its service interval"
                : "estimated mileage has crossed its service interval"),
            e.reasonDate &&
              (e.dueSoon
                ? "it's almost been a year since it was last serviced"
                : "it's been over a year since it was last serviced"),
          ]
            .filter(Boolean)
            .join(" and ");
          return `<li><strong>${e.itemName}</strong> ${verb} (${reasons}).</li>`;
        })
        .join("");

      const { vehicleBrand, vehicleModel } = vehicleEntries[0];
      const cid = `car-photo-${index}`;
      const attachment = await loadCarPhotoAttachment(vehicleBrand, vehicleModel, cid);
      if (attachment) attachments.push(attachment);

      return `
        <div style="margin-bottom: 24px;">
          ${attachment ? carPhotoHtml(cid, vehicleBrand, vehicleModel) : ""}
          <p style="font-weight: 600; margin: 0 0 4px;">${vehicleLabel}</p>
          <ul style="margin: 0;">${items}</ul>
        </div>
      `;
    })
  );

  const anyEstimated = entries.some((e) => e.isEstimated);
  const caveat = anyEstimated
    ? "<p>Some of these are estimates projected from your last recorded odometer reading — not confirmed readings. Please open the app and update your current odometer to confirm.</p>"
    : "";

  await sendMail(
    to,
    subject,
    `
      <p>The following ${entries.length === 1 ? "item needs" : "items need"} attention:</p>
      ${sections.join("")}
      ${caveat}
      <p>Already had this done? Update the vehicle's last service details in the app to clear this reminder.</p>
    `,
    attachments
  );
}

export async function sendOdometerUpdateNudgeEmail(
  to: string,
  params: {
    vehicleLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    daysSinceLastUpdate: number;
  }
) {
  const { vehicleLabel, vehicleBrand, vehicleModel, daysSinceLastUpdate } = params;

  const cid = "car-photo";
  const attachment = await loadCarPhotoAttachment(vehicleBrand, vehicleModel, cid);

  await sendMail(
    to,
    `Update your odometer for ${vehicleLabel}`,
    `
      ${attachment ? carPhotoHtml(cid, vehicleBrand, vehicleModel) : ""}
      <p>It's been ${daysSinceLastUpdate} days since you last updated the odometer for <strong>${vehicleLabel}</strong>.</p>
      <p>Keeping it current helps us give you accurate, timely service reminders.</p>
      <p>Open the app and update your current odometer reading when you get a chance.</p>
    `,
    attachment ? [attachment] : []
  );
}
