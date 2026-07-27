"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RESEND_COOLDOWN_SECONDS = 30;

export function OtpLoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function requestCode(targetEmail: string) {
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      if (!res.ok) {
        const message = await res
          .json()
          .then((body) => body.error?.email?.[0])
          .catch(() => undefined);
        setFormError(message ?? "Something went wrong. Please try again.");
        return false;
      }

      toast.success(`We sent a code to ${targetEmail}`);
      return true;
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
      return false;
    }
  }

  async function handleEmailSubmit(e: SubmitEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const ok = await requestCode(email);
      if (ok) {
        setStep("otp");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: SubmitEvent) {
    e.preventDefault();
    setFormError(null);

    if (!/^\d{6}$/.test(otp)) {
      setFormError("Enter the 6-digit code");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("otp", { email, otp, redirect: false });

      if (result?.error) {
        setFormError("That code is invalid or has expired.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      const ok = await requestCode(email);
      if (ok) setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={handleEmailSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="otp-email">Email</FieldLabel>
          <Input
            id="otp-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {isSubmitting ? "Sending code..." : "Send code"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleOtpSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <p className="text-sm text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
      </p>

      <Field>
        <FieldLabel htmlFor="otp-code">Code</FieldLabel>
        <Input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2Icon className="animate-spin" />}
        {isSubmitting ? "Verifying..." : "Verify & sign in"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setOtp("");
            setFormError(null);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || isSubmitting}
          className="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </form>
  );
}
