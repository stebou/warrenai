import { getUserAuth } from "@/lib/auth/utils";
import { redirect } from "next/navigation";
// import { ClerkProvider } from "@clerk/nextjs"; // <-- Supprimez cet import

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await getUserAuth(); // Correction: getUserAuth retourne un objet
  if (session) redirect("/dashboard");

  // Supprimez le ClerkProvider qui entoure les enfants
  return <div className="bg-muted h-screen pt-8">{children}</div>;
}