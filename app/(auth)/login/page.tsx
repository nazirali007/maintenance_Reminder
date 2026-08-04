"use client";

import Link from "next/link";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FieldSeparator } from "@/components/ui/field";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { OtpLoginForm } from "@/components/auth/otp-login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Enter your email — we&apos;ll send you a one-time code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OtpLoginForm />

        <FieldSeparator className="my-2">or</FieldSeparator>

        <GoogleSignInButton />
      </CardContent>
      {/* <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardFooter> */}
    </Card>
  );
}
