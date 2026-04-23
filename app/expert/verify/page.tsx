import { redirect } from "next/navigation";

export default async function ExpertVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params?.token || "";
  if (!token) redirect("/expert/login?error=invalid");
  redirect(`/api/expert/auth/verify?token=${encodeURIComponent(token)}`);
}
