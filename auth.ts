import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema, otpVerifySchema } from "@/lib/validations/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { allowed } = await checkRateLimit(
          `login:${parsed.data.email}`,
          LOGIN_RATE_LIMIT,
          LOGIN_RATE_WINDOW_MS
        );
        if (!allowed) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.password) return null;

        const passwordsMatch = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!passwordsMatch) return null;

        return user;
      },
    }),
    Credentials({
      id: "otp",
      name: "Email code",
      credentials: {
        email: {},
        otp: {},
      },
      authorize: async (credentials) => {
        const parsed = otpVerifySchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, otp } = parsed.data;

        const { allowed } = await checkRateLimit(
          `otp-verify:${email}`,
          LOGIN_RATE_LIMIT,
          LOGIN_RATE_WINDOW_MS
        );
        if (!allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const tokens = await prisma.verificationToken.findMany({
          where: { identifier: email, expires: { gt: new Date() } },
        });

        let matchedToken: (typeof tokens)[number] | null = null;
        for (const candidate of tokens) {
          if (await bcrypt.compare(otp, candidate.token)) {
            matchedToken = candidate;
            break;
          }
        }

        if (!matchedToken) return null;

        await prisma.verificationToken.deleteMany({
          where: { identifier: email },
        });

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
