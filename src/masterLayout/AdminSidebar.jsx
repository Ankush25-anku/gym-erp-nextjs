"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import axios from "axios";

const AdminSidebar = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [joinedGymCode, setJoinedGymCode] = useState("");
  const [showJoinGym, setShowJoinGym] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [isValidCode, setIsValidCode] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [profile, setProfile] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch Clerk profile
  useEffect(() => {
    if (isLoaded && user) fetchProfile();
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clerkusers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile({ ...data, role: data.role || "member" });
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // Load gym code from localStorage per user
  useEffect(() => {
    if (typeof window !== "undefined" && user?.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      const savedCode = localStorage.getItem(`joinedGymCode_${email}`);
      if (savedCode) setJoinedGymCode(savedCode);
    }
  }, [user]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowJoinGym(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check Gym Code
  const handleCheckCode = async () => {
    try {
      const token = await getToken();
      if (!token) return alert("No auth token found. Please login again.");

      const normalizedCode = enteredCode.trim().toUpperCase();
      if (!normalizedCode) {
        setIsValidCode(false);
        setValidationMessage("⚠️ Please enter a gym code.");
        return;
      }

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supergyms/verify-code`,
        { gymCode: normalizedCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.valid) {
        setIsValidCode(true);
        setValidationMessage("✅ Gym code is valid!");
      } else {
        setIsValidCode(false);
        setValidationMessage("❌ Invalid gym code.");
      }
    } catch (err) {
      console.error("Error verifying gym code:", err);
      setIsValidCode(false);
      setValidationMessage("⚠️ Error verifying gym code.");
    }
  };

  // Submit Join Gym
  const handleSubmitJoin = async () => {
    try {
      const token = await getToken();
      if (!token) return alert("No auth token found. Please login again.");

      const normalizedCode = enteredCode.trim().toUpperCase();
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supergyms/join`,
        { gymCode: normalizedCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const email = user.primaryEmailAddress.emailAddress;
        alert("🎉 Successfully joined the gym!");
        setJoinedGymCode(normalizedCode);
        localStorage.setItem(`joinedGymCode_${email}`, normalizedCode);
        setShowJoinGym(false);
        setEnteredCode("");
        setIsValidCode(false);
        setValidationMessage("");
      } else {
        alert("❌ Failed to join gym.");
      }
    } catch (err) {
      console.error("Error joining gym:", err);
      alert("❌ Something went wrong while joining gym.");
    }
  };

  return (
    <>
      <aside
        className="admin-sidebar"
        style={{
          width: "250px",
          backgroundColor: "#fff",
          borderRight: "1px solid #eaeaea",
          minHeight: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          overflowY: "auto",
          boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
          zIndex: 1000,
        }}
      >
        {/* Profile + Join Gym */}
        <div
          className="sidebar-profile-section d-flex flex-column align-items-center p-3 border-bottom"
          style={{ gap: "8px" }}
        >
          <img
            src="/assets/images/profile/profile.jpg"
            alt="Profile"
            className="rounded-circle"
            style={{ width: "50px", height: "50px", objectFit: "cover" }}
          />
          {joinedGymCode ? (
            <span
              className="btn btn-sm btn-success"
              style={{ borderRadius: "12px", fontSize: "0.8rem", padding: "2px 8px" }}
            >
              Gym: {joinedGymCode} ✅
            </span>
          ) : (
            <button
              onClick={() => setShowJoinGym(true)}
              className="btn btn-sm btn-primary"
              style={{ borderRadius: "12px", fontSize: "0.8rem", padding: "2px 8px" }}
            >
              Join Gym
            </button>
          )}
        </div>

        {/* Sidebar Menu */}
        <nav className="mt-3 px-2">
          <ul className="sidebar-menu">
            <li>
              <Link href="/admin-dashboard">Dashboard</Link>
            </li>
            <li>
              <Link href="/attendance">Attendance</Link>
            </li>
            <li>
              <Link href="/members">Members</Link>
            </li>
            <li>
              <Link href="/trainers">Trainers</Link>
            </li>
            <li>
              <Link href="/plans">Plans</Link>
            </li>
            <li>
              <Link href="/schedule">Schedule</Link>
            </li>
            <li>
              <Link href="/admin-staff">Staff</Link>
            </li>
            <li>
              <Link href="/expenses">Expenses</Link>
            </li>
            <li>
              <Link href="/gym">Gym</Link>
            </li>
            <li>
              <Link href="/inventory">Inventory</Link>
            </li>
            <li>
              <Link href="/income">Income</Link>
            </li>
            <li>
              <Link href="/notifications">Notifications</Link>
            </li>
            <li>
              <Link href="/payments">Payments</Link>
            </li>
            <li>
              <Link href="/rolespermission">Roles & Permissions</Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Join Gym Modal */}
      {showJoinGym && (
        <div
          className="join-gym-modal"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            paddingTop: "20vh",
          }}
          ref={dropdownRef}
        >
          <div
            className="modal-backdrop"
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              zIndex: 2000,
            }}
            onClick={() => setShowJoinGym(false)}
          ></div>

          <div
            className="modal-content p-4"
            style={{
              position: "relative",
              zIndex: 2001,
              background: "#fff",
              borderRadius: "8px",
              width: "320px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Join Gym</h5>
              <button type="button" className="btn-close" onClick={() => setShowJoinGym(false)}></button>
            </div>
            <input
              type="text"
              placeholder="Enter Gym Code"
              value={enteredCode}
              onChange={(e) => {
                setEnteredCode(e.target.value);
                setIsValidCode(false);
                setValidationMessage("");
              }}
              className="form-control mb-2"
              autoFocus
            />
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-info" onClick={handleCheckCode}>
                Check
              </button>
              {isValidCode && (
                <button className="btn btn-sm btn-success" onClick={handleSubmitJoin}>
                  Submit
                </button>
              )}
              <button className="btn btn-sm btn-secondary" onClick={() => setShowJoinGym(false)}>
                Cancel
              </button>
            </div>
            {validationMessage && (
              <p className={`mt-2 ${isValidCode ? "text-success" : "text-danger"}`}>
                {validationMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
