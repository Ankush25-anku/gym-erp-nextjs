"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth, SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import axios from "axios";

const API_BASE = "http://localhost:5000";

export default function AfterSignInPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const roleMap = {
    Owner: { key: "superadmin", path: "/superadmin" },
    Member: { key: "member", path: "/member" },
    Staff: { key: "staff", path: "/staff" },
    Trainer: { key: "trainer", path: "/trainer" },
    Admin: { key: "admin", path: "/admin-dashboard" },
  };

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
  useEffect(() => {
    const init = async () => {
      if (!isUserLoaded || !isAuthLoaded) return;
      if (!user) {
        setError("User not found. Please login again.");
        return;
      }

      const email = user.primaryEmailAddress?.emailAddress;
      const token = await getToken();

      if (!email || !token) {
        setError("Missing email or token");
        return;
      }

      try {
        // 🧩 Always check backend first (to get latest role)
        const res = await axios.get(`${API_BASE}/api/clerkusers/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { role: backendRole, allowedEmail } = res.data;

        // 🧩 Save lowercase role
        if (backendRole) {
          localStorage.setItem("userRole", backendRole.toLowerCase());

          // 🧩 If role is Staff → auto-register as employee
          if (backendRole.toLowerCase() === "staff") {
            try {
              const employeeData = {
                fullName: `${user.firstName || ""} ${
                  user.lastName || ""
                }`.trim(),
                email,
                phone: user?.phoneNumbers?.[0]?.phoneNumber || "",
                department: "General",
                position: "Staff",
                profileImage: user.imageUrl || "",
                requestAdminAccess: false,
                role: "staff",
              };

              await axios.post(
                `${API_BASE}/api/employees/register`,
                employeeData,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              console.log("✅ Employee auto-registered successfully");
            } catch (err) {
              console.warn(
                "⚠️ Employee auto-registration failed:",
                err.message
              );
            }
          }

          // 🧭 Redirect based on role
          router.replace(roleMap[capitalize(backendRole)]?.path || "/");
          return;
        }

        // 🧩 Fallback to Clerk publicMetadata role if backend doesn’t have one
        const clerkRole = user.publicMetadata?.role;
        if (clerkRole) {
          localStorage.setItem("userRole", clerkRole.toLowerCase());
          router.replace(roleMap[capitalize(clerkRole)]?.path || "/");
          return;
        }

        // 🧩 If role not set at all — show modal to pick role
        setShowRoleModal(true);
      } catch (err) {
        console.error("Error fetching role:", err);
        setError("Failed to get role from backend");
      }
      try {
        // 🧩 Always check backend first (to get latest role)
        const res = await axios.get(`${API_BASE}/api/clerkusers/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { role: backendRole, allowedEmail } = res.data;

        // 🧩 Save lowercase role
        if (backendRole) {
          localStorage.setItem("userRole", backendRole.toLowerCase());

          // 🧩 If role is Staff → auto-register as employee
          if (backendRole.toLowerCase() === "staff") {
            try {
              const employeeData = {
                fullName: `${user.firstName || ""} ${
                  user.lastName || ""
                }`.trim(),
                email,
                phone: user?.phoneNumbers?.[0]?.phoneNumber || "",
                department: "General",
                position: "Staff",
                profileImage: user.imageUrl || "",
                requestAdminAccess: false,
                role: "staff",
              };

              await axios.post(
                `${API_BASE}/api/employees/register`,
                employeeData,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              console.log("✅ Employee auto-registered successfully");
            } catch (err) {
              console.warn(
                "⚠️ Employee auto-registration failed:",
                err.message
              );
            }
          }

          // 🧭 Redirect based on role
          router.replace(roleMap[capitalize(backendRole)]?.path || "/");
          return;
        }

        // 🧩 Fallback to Clerk publicMetadata role if backend doesn’t have one
        const clerkRole = user.publicMetadata?.role;
        if (clerkRole) {
          localStorage.setItem("userRole", clerkRole.toLowerCase());
          router.replace(roleMap[capitalize(clerkRole)]?.path || "/");
          return;
        }

        // 🧩 If role not set at all — show modal to pick role
        setShowRoleModal(true);
      } catch (err) {
        console.error("Error fetching role:", err);
        setError("Failed to get role from backend");
      }
    };

    init();
  }, [isUserLoaded, isAuthLoaded, user, getToken, router]);
  const handleRoleSelect = async (roleLabel) => {
    const roleData = roleMap[roleLabel];
    if (!roleData) return;

    try {
      const token = await getToken(); // 🔐 Get Clerk JWT
      if (!token) {
        alert("Unauthorized: No token found");
        return;
      }

      // 🚀 ✅ FIX — Save role in backend correctly
      await axios.post(
        `${API}/api/clerkusers/set-role`,
        { role: roleData.key },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("userRole", roleData.key);
      setShowRoleModal(false);
      router.push(roleData.path);
    } catch (err) {
      console.error(
        "❌ Failed to set role:",
        err.response?.data || err.message
      );
      alert("Failed to save role in backend");
    }
  };

  if (!isUserLoaded || !isAuthLoaded) return <p>Loading...</p>;

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
                boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
              }}
            >
              <h2 style={{ marginBottom: "0.5rem" }}>
                Welcome, {user?.firstName || "New User"} 🎉
              </h2>
              <p style={{ marginBottom: "1.5rem", color: "#555" }}>
                Please select your role to continue:
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {["Owner", "Staff", "Member", "Trainer"].map((roleLabel) => (
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
                          : roleLabel === "Member"
                          ? "#10b981"
                          : "#8b5cf6",
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
        )}

        {!showRoleModal && !error && <p>Redirecting based on your role...</p>}
      </SignedIn>

      <SignedOut>
        <SignIn afterSignInUrl="/after-signin" routing="path" />
      </SignedOut>
    </>
  );
}
