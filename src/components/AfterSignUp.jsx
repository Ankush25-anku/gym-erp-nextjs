// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useUser } from "@clerk/nextjs";

// export default function AfterSignUp() {
//   const { user, isLoaded: isUserLoaded } = useUser();
//   const router = useRouter();
//   const [showRoleModal, setShowRoleModal] = useState(false);

//   const roleMap = {
//     Owner: { key: "superadmin", path: "/complete-profile?role=superadmin" },
//     Member: { key: "member", path: "/complete-profile?role=member" },
//     Staff: { key: "admin", path: "/staff-profile" },
//   };

//   useEffect(() => {
//     if (isUserLoaded && user) {
//       const isNewUser = user.createdAt === user.lastSignInAt; // first login
//       if (isNewUser) {
//         setShowRoleModal(true);
//       } else {
//         // redirect returning users based on stored role
//         const role = localStorage.getItem("userRole");
//         if (role) {
//           router.push(
//             role === "superadmin"
//               ? "/complete-profile?role=superadmin"
//               : role === "admin"
//               ? "/staff-profile"
//               : "/complete-profile?role=member"
//           );
//         }
//       }
//     }
//   }, [isUserLoaded, user, router]);

//   const handleRoleSelect = (roleLabel) => {
//     const roleData = roleMap[roleLabel];
//     if (!roleData) return;

//     if (typeof window !== "undefined") {
//       localStorage.setItem("userRole", roleData.key);
//     }

//     setShowRoleModal(false);
//     router.push(roleData.path);
//   };

//   if (!showRoleModal) return null;

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         backgroundColor: "rgba(0,0,0,0.7)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 9999,
//       }}
//     >
//       <div
//         style={{
//           background: "white",
//           borderRadius: "16px",
//           padding: "2rem",
//           width: "420px",
//           textAlign: "center",
//           boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
//         }}
//       >
//         <h2 style={{ marginBottom: "0.5rem" }}>
//           Welcome, {user?.firstName || "New User"} 🎉
//         </h2>
//         <p style={{ marginBottom: "1.5rem", color: "#555" }}>
//           Please select your role to continue:
//         </p>
//         <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
//           {["Owner", "Staff", "Member"].map((roleLabel) => (
//             <button
//               key={roleLabel}
//               onClick={() => handleRoleSelect(roleLabel)}
//               style={{
//                 padding: "0.9rem 1rem",
//                 borderRadius: "10px",
//                 border: "none",
//                 background:
//                   roleLabel === "Owner"
//                     ? "#f59e0b"
//                     : roleLabel === "Staff"
//                     ? "#3b82f6"
//                     : "#10b981",
//                 color: "white",
//                 fontSize: "1rem",
//                 fontWeight: "bold",
//                 cursor: "pointer",
//               }}
//             >
//               {roleLabel}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
