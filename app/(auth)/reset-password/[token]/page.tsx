import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage(
  props: PageProps<"/reset-password/[token]">
) {
  const { token } = await props.params;

  return <ResetPasswordForm token={token} />;
}
