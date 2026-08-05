import "server-only";
import nodemailer from "nodemailer";

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

export async function sendMaintenanceDueEmail(
  to: string,
  params: {
    vehicleLabel: string;
    itemName: string;
    reasonKm: boolean;
    reasonDate: boolean;
    dueSoon?: boolean;
  }
) {
  const { vehicleLabel, itemName, reasonKm, reasonDate, dueSoon = false } = params;
  const reasons = [
    reasonKm &&
      (dueSoon
        ? "your estimated mileage is approaching its service interval"
        : "your estimated mileage has crossed its service interval"),
    reasonDate &&
      (dueSoon
        ? "it's almost been a year since it was last serviced"
        : "it's been over a year since it was last serviced"),
  ].filter(Boolean);
  const verb = dueSoon ? "will be due soon" : "may be due";

  await sendMail(
    to,
    `${itemName} ${verb} — ${vehicleLabel}`,
    `
      <p><strong>${vehicleLabel}</strong> — <strong>${itemName}</strong> ${verb} for service.</p>
      <p>This is an estimate based on ${reasons.join(" and ")}, projected from your last recorded odometer reading — not a confirmed reading.</p>
      <p>Please open the app and update your current odometer to confirm.</p>
    `
  );
}

export async function sendOdometerUpdateNudgeEmail(
  to: string,
  params: { vehicleLabel: string; daysSinceLastUpdate: number }
) {
  const { vehicleLabel, daysSinceLastUpdate } = params;

  await sendMail(
    to,
    `Update your odometer for ${vehicleLabel}`,
    `
      <p>It's been ${daysSinceLastUpdate} days since you last updated the odometer for <strong>${vehicleLabel}</strong>.</p>
      <p>Keeping it current helps us give you accurate, timely service reminders.</p>
      <p>Open the app and update your current odometer reading when you get a chance.</p>
    `
  );
}
