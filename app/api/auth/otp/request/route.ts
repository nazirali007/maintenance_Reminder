import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { sendOtpEmail } from "@/lib/server/email";
import { otpRequestSchema } from "@/lib/validations/auth";
import { enforceRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
// A looser per-IP cap on top of the per-email one, so a single attacker can't
// email-bomb a stream of different addresses from one machine.
const IP_RATE_LIMIT = 20;

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const ipLimited = await enforceRateLimit(
      `otp-request-ip:${getClientIp(request)}`,
      IP_RATE_LIMIT,
      RATE_WINDOW_MS
    );
    if (ipLimited) return ipLimited;

    const body = await request.json();
    const parsed = otpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const limited = await enforceRateLimit(
      `otp-request:${email}`,
      RATE_LIMIT,
      RATE_WINDOW_MS
    );
    if (limited) return limited;

    // The response is identical whether or not an account already exists for
    // this email — verifying the OTP auto-creates the account if needed, so
    // there's nothing to enumerate.
    const genericResponse = Response.json({
      message: "If your email is valid, a code has been sent.",
    });

    const code = randomInt(100000, 1000000).toString();
    const hashedCode = await bcrypt.hash(code, 12);

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedCode,
        expires: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    try {
      await sendOtpEmail(email, code);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      return Response.json(
        { error: { email: ["Couldn't send the code. Please try again."] } },
        { status: 502 }
      );
    }

    return genericResponse;
  });
}
