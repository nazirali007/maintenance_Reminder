import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";
import { otpRequestSchema } from "@/lib/validations/auth";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = otpRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond with the same message so this endpoint can't be used
  // to enumerate which emails have accounts.
  const genericResponse = Response.json({
    message: "If an account exists for that email, a code has been sent.",
  });

  if (!user) {
    return genericResponse;
  }

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
}
