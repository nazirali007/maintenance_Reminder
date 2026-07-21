import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

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
    message: "If an account exists for that email, a reset link has been sent.",
  });

  if (!user) {
    return genericResponse;
  }

  const token = randomBytes(32).toString("hex");

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password/${token}`;

  await sendPasswordResetEmail(email, resetUrl);

  return genericResponse;
}
