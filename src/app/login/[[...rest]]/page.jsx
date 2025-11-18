// "use client";

// import { SignIn } from "@clerk/nextjs";

// export default function LoginPage() {
//   return (
//     <SignIn
//       path="/login"
//       routing="path"
//       afterSignInUrl="/after-signin" // redirect here
//     />
//   );
// }
"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh", // full viewport height
        backgroundColor: "#f5f5f5", // optional light background
      }}
    >
      <div style={{ width: "400px", minWidth: "300px" }}>
        <SignIn path="/login" routing="path" afterSignInUrl="/after-signin" />
      </div>
    </div>
  );
}
