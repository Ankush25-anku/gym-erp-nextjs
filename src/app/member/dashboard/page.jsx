"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import MasterLayout from "../../../masterLayout/MasterLayout";

const MemberDashboard = () => {
  const { getToken, isLoaded } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded) return;

      try {
        const token = await getToken();
        if (!token) {
          setError("⚠️ No token retrieved from Clerk.");
          return;
        }

        console.log("🔐 Clerk Token:", token); // ✅ Log token to console

        const res = await fetch("http://localhost:5000/api/clerkusers/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("❌ Failed to fetch user data");

        const data = await res.json();
        setUserData(data);

        console.log("👤 User Data from API:", data); // ✅ Log user data to console

        if (typeof window !== "undefined") {
          localStorage.setItem("userRole", data.role);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoaded, getToken]);

  return (
    <MasterLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>📋 Member Dashboard</h1>
        <UserButton afterSignOutUrl="/login" />
      </div>
      {loading && <p>🔄 Loading user data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {userData && (
        <div>
          <h3>👤 User Info:</h3>
          <pre style={{ background: "#f4f4f4", padding: "1rem" }}>
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
      )}
      <p>✅ Check the console for token and user info logs.</p>
    </MasterLayout>
  );
};

export default MemberDashboard;
