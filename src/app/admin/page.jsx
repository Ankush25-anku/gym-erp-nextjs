import { redirect } from "next/navigation";

export default function AdminRedirectPage() {
  // Redirect to dashboard automatically
  redirect("/admin/dashboard");
}
