"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      path="/sign-up"
      routing="path"
      afterSignUpUrl="/after-signup" // ✅ Redirect new users here
      afterSignInUrl="/" // Optional: where returning users go
    />
  );
}
