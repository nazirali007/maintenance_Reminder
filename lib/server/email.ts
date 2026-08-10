import "server-only";
import nodemailer from "nodemailer";
import { getModelImagePath } from "@/lib/car-catalog";
import { getSiteUrl } from "@/lib/site-url";

function absoluteCarPhotoUrl(brand: string, model: string): string | null {
  const imagePath = getModelImagePath(brand, model);
  return imagePath ? `${getSiteUrl()}${imagePath}` : null;
}

function carPhotoHtml(brand: string, model: string): string {
  const photoUrl = absoluteCarPhotoUrl(brand, model);
  if (!photoUrl) return "";

  return `<img src="${photoUrl}" alt="${brand} ${model}" width="480" style="display: block; width: 100%; max-width: 480px; height: auto; border-radius: 12px; margin-bottom: 12px;" />`;
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

async function sendMail(to: string, subject: string, html: string) {
  await getTransporter().sendMail({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject,
    html,
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

  const sections = [...vehicleGroups.entries()]
    .map(([vehicleLabel, vehicleEntries]) => {
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

      return `
        <div style="margin-bottom: 24px;">
          ${carPhotoHtml(vehicleBrand, vehicleModel)}
          <p style="font-weight: 600; margin: 0 0 4px;">${vehicleLabel}</p>
          <ul style="margin: 0;">${items}</ul>
        </div>
      `;
    })
    .join("");

  const anyEstimated = entries.some((e) => e.isEstimated);
  const caveat = anyEstimated
    ? "<p>Some of these are estimates projected from your last recorded odometer reading — not confirmed readings. Please open the app and update your current odometer to confirm.</p>"
    : "";

  await sendMail(
    to,
    subject,
    `
      <p>The following ${entries.length === 1 ? "item needs" : "items need"} attention:</p>
      ${sections}
      ${caveat}
      <p>Already had this done? Update the vehicle's last service details in the app to clear this reminder.</p>
    `
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

  await sendMail(
    to,
    `Update your odometer for ${vehicleLabel}`,
    `
      ${carPhotoHtml(vehicleBrand, vehicleModel)}
      <p>It's been ${daysSinceLastUpdate} days since you last updated the odometer for <strong>${vehicleLabel}</strong>.</p>
      <p>Keeping it current helps us give you accurate, timely service reminders.</p>
      <p>Open the app and update your current odometer reading when you get a chance.</p>
    `
  );
}
