import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <main className="grid place-items-center pt-4">
      <SignUp 
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-2xl"
          }
        }}
        routing="hash"
        signInUrl="/sign-in"
      />
    </main>
  );
}