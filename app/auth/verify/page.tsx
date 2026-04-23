import { redirect } from "next/navigation";

/**
 * /auth/verify?token=xxx is the URL in the email. We can't do the
 * cookie-setting work here (server component), so we redirect to the
 * API route which does the real verification + cookie + final redirect.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token || "";
  if (!token) {
    redirect("/login?error=invalid");
  }
  redirect(`/api/auth/verify?token=${encodeURIComponent(token)}`);
}
