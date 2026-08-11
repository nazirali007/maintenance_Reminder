import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { enforceRateLimit, getClientIp } from "@/lib/server/rate-limit";
import { withApiErrorHandling } from "@/lib/server/api-error";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  return withApiErrorHandling(async () => {
    const limited = await enforceRateLimit(
      `reset-password:${getClientIp(request)}`,
      RATE_LIMIT,
      RATE_WINDOW_MS
    );
    if (limited) return limited;

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.expires < new Date()) {
      return Response.json(
        { error: { token: ["This reset link is invalid or has expired"] } },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return Response.json({ message: "Password reset successfully" });
  });
}
