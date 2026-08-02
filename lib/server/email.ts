import "server-only";
import { Resend } from "resend";

let resend: Resend | undefined;

function getResend() {
  return (resend ??= new Resend(process.env.RESEND_API_KEY));
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject: "Reset your password",
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend failed to send password reset email: ${error.message}`);
  }
}

export async function sendOtpEmail(to: string, code: string) {
  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject: `${code} is your sign-in code`,
    html: `
      <p>Use this code to sign in:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend failed to send OTP email: ${error.message}`);
  }
}

export async function sendMaintenanceDueEmail(
  to: string,
  params: {
    vehicleLabel: string;
    itemName: string;
    reasonKm: boolean;
    reasonDate: boolean;
  }
) {
  const { vehicleLabel, itemName, reasonKm, reasonDate } = params;
  const reasons = [
    reasonKm && "your estimated mileage has crossed its service interval",
    reasonDate && "it's been over a year since it was last serviced",
  ].filter(Boolean);

  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject: `${itemName} may be due — ${vehicleLabel}`,
    html: `
      <p><strong>${vehicleLabel}</strong> — <strong>${itemName}</strong> may be due for service.</p>
      <p>This is an estimate based on ${reasons.join(" and ")}, projected from your last recorded odometer reading — not a confirmed reading.</p>
      <p>Please open the app and update your current odometer to confirm.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend failed to send maintenance due email: ${error.message}`);
  }
}

export async function sendOdometerUpdateNudgeEmail(
  to: string,
  params: { vehicleLabel: string; daysSinceLastUpdate: number }
) {
  const { vehicleLabel, daysSinceLastUpdate } = params;

  const { error } = await getResend().emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject: `Update your odometer for ${vehicleLabel}`,
    html: `
      <p>It's been ${daysSinceLastUpdate} days since you last updated the odometer for <strong>${vehicleLabel}</strong>.</p>
      <p>Keeping it current helps us give you accurate, timely service reminders.</p>
      <p>Open the app and update your current odometer reading when you get a chance.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend failed to send odometer nudge email: ${error.message}`);
  }
}
