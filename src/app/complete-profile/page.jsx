"use client";

import { Suspense } from "react";
import CompleteProfilePageContent from "../../components/CompleteProfilePageContent";

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompleteProfilePageContent />
    </Suspense>
  );
}
