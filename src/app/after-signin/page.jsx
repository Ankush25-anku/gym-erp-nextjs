"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function AfterSignInPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const router = useRouter();

  const [error, setError] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // ROLE MAP
  const roleMap = {
    superadmin: "/superadmin",
    admin: "/admin-dashboard",
    staff: "/staff",
    member: "/member",
    trainer: "/trainer",
  };

  // Convert any input role
  const normalizeRole = (role) =>
    role ? role.toString().trim().toLowerCase() : null;

  // ----------------------
  //     MAIN LOGIC
  // ----------------------
  useEffect(() => {
    const init = async () => {
      if (!isUserLoaded || !isAuthLoaded) return;

      if (!user) {
        setError("User not found. Please login again.");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Missing token");
        return;
      }

      try {
        //---------------------------------
        // 1️⃣ GET BACKEND ROLE
        //---------------------------------
        let backendRole = null;

        try {
          const res = await axios.get(`${API_BASE}/api/clerkusers/get-role`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          backendRole = normalizeRole(res.data.role);
          console.log("🔥 Backend Role:", backendRole);
        } catch (e) {
          console.log("Backend role fetch failed (not fatal)");
        }

        //---------------------------------
        // 2️⃣ GET CLERK STORED ROLE
        //---------------------------------
        const clerkRole = normalizeRole(user.publicMetadata?.role);
        console.log("⚡ Clerk Metadata Role:", clerkRole);

        //---------------------------------
        // 3️⃣ DECIDE FINAL ROLE
        //---------------------------------
        const finalRole = backendRole || clerkRole || null;
        console.log("🎯 Final Decided Role:", finalRole);

        //---------------------------------
        // 4️⃣ IF ROLE EXISTS → REDIRECT
        //---------------------------------
        if (finalRole) {
          localStorage.setItem("userRole", finalRole);

          const redirectPath = roleMap[finalRole] || "/";
          console.log("➡ Redirecting to:", redirectPath);

          router.replace(redirectPath);
          return;
        }

        //---------------------------------
        // 5️⃣ NO ROLE ANYWHERE → SHOW ROLE SELECTOR
        //---------------------------------
        setShowRoleModal(true);
      } catch (err) {
        console.error("❌ Error:", err);
        setError("Unexpected error occurred.");
      }
    };

    init();
  }, [isUserLoaded, isAuthLoaded, user, router]);

  // ----------------------
  //   ROLE SELECT HANDLER
  // ----------------------
  const handleRoleSelect = async (roleLabel) => {
    const role = roleLabel.toLowerCase();

    try {
      const token = await getToken();
      if (!token) {
        alert("Unauthorized");
        return;
      }

      console.log("💾 Saving role:", role);

      await axios.post(
        `${API_BASE}/api/clerkusers/set-role`,
        { role },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      localStorage.setItem("userRole", role);

      setShowRoleModal(false);

      router.push(roleMap[role] || "/");
    } catch (err) {
      console.error("❌ Failed to set role:", err);
      alert("Failed to save role in backend");
    }
  };

  // ----------------------
  //       UI RENDER
  // ----------------------
  return (
    <>
      <SignedIn>
        {error && <p className="text-red-500">{error}</p>}

        {showRoleModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                padding: "2rem",
                width: "420px",
                textAlign: "center",
              }}
            >
              <h2>Welcome, {user?.firstName || "New User"} 🎉</h2>
              <p>Select your role to continue:</p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {["superadmin", "admin", "staff", "member", "trainer"].map(
                  (role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      style={{
                        padding: "0.9rem 1rem",
                        borderRadius: "10px",
                        background:
                          role === "superadmin"
                            ? "#f59e0b"
                            : role === "admin"
                            ? "#ef4444"
                            : role === "staff"
                            ? "#3b82f6"
                            : role === "member"
                            ? "#10b981"
                            : "#8b5cf6",
                        color: "white",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      {role.toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {!showRoleModal && !error && (
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            Redirecting based on your role...
          </p>
        )}
      </SignedIn>

      <SignedOut>
        <SignIn afterSignInUrl="/after-signin" routing="path" />
      </SignedOut>
    </>
  );
}
