"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";

const StaffProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ userId auto-stored here
  const [profile, setProfile] = useState({
    userId: "",
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    requestAdminAccess: false,
  });

  // ✅ Insert userId automatically in state (and for WebView if used)
  useEffect(() => {
    if (isLoaded && user) {
      const clerkUserId = user.id;
      localStorage.setItem("userId", clerkUserId); // optional if you need in WebView/RN
      setProfile((prev) => ({
        ...prev,
        userId: clerkUserId, // ✅ Auto-store userId
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(), // prefill name
        email: user.primaryEmailAddress?.emailAddress || "", // auto-fill email
      }));

      // optional: post to native through WebView
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ userId: clerkUserId })
      );
    }
  }, [isLoaded, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 10) {
        setPhoneError("Phone number cannot exceed 10 digits");
      } else if (numericValue.length < 10 && numericValue.length > 0) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }
      setProfile((p) => ({ ...p, phone: numericValue }));
    } else {
      setProfile((p) => ({
        ...p,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!/^\d{10}$/.test(profile.phone)) {
      setPhoneError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/employees/register`;

      console.log("🌐 POST →", apiUrl);
      console.log("Payload →", profile); // ✅ includes userId automatically

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON. Response was: " + text);
      }

      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to save profile");

      console.log("✅ Saved →", data);

      // ✅ Save role/fullname locally for immediate use
      localStorage.setItem("userFullName", profile.fullName);
      localStorage.setItem(
        "userRole",
        profile.requestAdminAccess ? "admin" : "staff"
      );

      router.push(profile.requestAdminAccess ? "/admin-dashboard" : "/staff");
    } catch (err) {
      console.error("❌ Error:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="col-md-6 mx-auto">
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-header bg-primary text-white rounded-top-4 text-center">
            <h5 className="mb-0">Staff Profile Form</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row gy-3">
                {/* Full Name */}
                <div className="col-12">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="fullName"
                    placeholder="Enter Full Name"
                    value={profile.fullName}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div className="col-12">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Enter Email"
                    value={profile.email}
                    onChange={handleChange}
                    readOnly // optional, remove if you want editable
                  />
                </div>

                {/* Phone */}
                <div className="col-12">
                  <label className="form-label">Phone Number</label>
                  <div className="d-flex gap-2">
                    <select className="form-select w-25" defaultValue="IN">
                      <option value="IN">IN</option>
                      <option value="US">US</option>
                      <option value="UK">UK</option>
                    </select>
                    <input
                      type="text"
                      name="phone"
                      className={`form-control ${
                        phoneError ? "is-invalid" : ""
                      }`}
                      placeholder="Enter 10-digit number"
                      value={profile.phone}
                      onChange={handleChange}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </div>
                  {phoneError && (
                    <div className="text-danger small mt-1">{phoneError}</div>
                  )}
                </div>

                {/* Department */}
                <div className="col-12">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    name="department"
                    placeholder="E.g. Fitness, Accounts"
                    value={profile.department}
                    onChange={handleChange}
                  />
                </div>

                {/* Position */}
                <div className="col-12">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-control"
                    name="position"
                    placeholder="E.g. Trainer, Manager"
                    value={profile.position}
                    onChange={handleChange}
                  />
                </div>

                {/* Request Admin Access */}
                <div className="col-12">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      id="requestAdminAccess"
                      name="requestAdminAccess"
                      className="form-check-input"
                      checked={profile.requestAdminAccess}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="requestAdminAccess"
                      className="form-check-label"
                    >
                      Request Admin Access
                    </label>
                  </div>
                </div>

                {/* Submit */}
                <div className="col-12">
                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Submit"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
