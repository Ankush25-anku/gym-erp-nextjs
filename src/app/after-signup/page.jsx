"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export default function AfterSignUp() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { client } = useClerk();
  const router = useRouter();

  const [showRoleModal, setShowRoleModal] = useState(false);

  // Mapping for role redirects
  const roleMap = {
    Owner: { key: "superadmin", path: "/complete-profile?role=superadmin" },
    Member: { key: "member", path: "/member-profile" },
    Staff: { key: "admin", path: "/staff-profile" },
  };

  // ✅ Step 1: Check if user already has a role set
  useEffect(() => {
    if (isUserLoaded && user) {
      const userRole = user.publicMetadata?.role;
      if (userRole) {
        // Already selected role before → skip AfterSignUp
        redirectToDashboard(userRole);
      } else {
        setShowRoleModal(true);
      }
    }
  }, [isUserLoaded, user]);

  const redirectToDashboard = (role) => {
    const paths = {
      superadmin: "/superadmin",
      admin: "/admin/dashboard",
      member: "/member/dashboard",
    };
    router.push(paths[role] || "/");
  };

  // ✅ Step 2: When user selects a role
  // inside your AfterSignUp component (client)
  const handleRoleSelect = async (roleLabel) => {
    const roleData = roleMap[roleLabel];
    if (!roleData) return;

    try {
      const res = await fetch("/api/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: roleData.key }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to set role");
      }

      // store locally for immediate UI needs, then navigate
      if (typeof window !== "undefined") {
        localStorage.setItem("userRole", roleData.key);
      }

      setShowRoleModal(false);
      router.push(roleData.path);
    } catch (error) {
      console.error("Failed to set role:", error);
      // show a toast/UI error as needed
    }
  };

  if (!showRoleModal) return null;

  return (
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
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}
      >
        <h2 style={{ marginBottom: "0.5rem" }}>
          Welcome, {user?.firstName || "New User"} 🎉
        </h2>
        <p style={{ marginBottom: "1.5rem", color: "#555" }}>
          Please select your role to continue:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {["Owner", "Staff", "Member"].map((roleLabel) => (
            <button
              key={roleLabel}
              onClick={() => handleRoleSelect(roleLabel)}
              style={{
                padding: "0.9rem 1rem",
                borderRadius: "10px",
                border: "none",
                background:
                  roleLabel === "Owner"
                    ? "#f59e0b"
                    : roleLabel === "Staff"
                    ? "#3b82f6"
                    : "#10b981",
                color: "white",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {roleLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
