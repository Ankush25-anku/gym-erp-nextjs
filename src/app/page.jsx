"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/after-signup"); // instantly redirect to after-signup
  }, [router]);

  return null; // nothing will render — instant redirect
}
