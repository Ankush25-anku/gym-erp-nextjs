"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";

const StaffProfilePage = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  // At the top of your component
  const [userRole, setUserRole] = useState(""); // ✅ role state
  const [userFullName, setUserFullName] = useState("");
  const [phoneError, setPhoneError] = useState(""); // ✅ full name state

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    requestAdminAccess: false,
  });

  useEffect(() => {
    if (isUserLoaded && user) {
      setProfile((prev) => ({
        ...prev,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [isUserLoaded, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone") {
      // ✅ Allow only digits
      const numericValue = value.replace(/\D/g, "");

      // ✅ Validate length
      if (/[^0-9]/.test(value)) {
        setPhoneError("Please type only numbers (0–9)");
      } else if (numericValue.length > 10) {
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

  const handleKeyDown = (e) => {
    if (!/[0-9]|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) {
      e.preventDefault();
      setPhoneError("Only numeric input allowed (0–9)");
    } else {
      setPhoneError("");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!/^\d{10}$/.test(profile.phone)) {
      setLoading(false);
      setPhoneError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      const token = await getToken();

      console.log("🧩 Submitting profile data:", profile);
      console.log(
        "🔑 Using token:",
        token ? "✅ Token present" : "❌ No token"
      );

      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      }/api/employees/register`;

      console.log("🌍 Sending POST to:", apiUrl);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const contentType = res.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("❌ Server did not return JSON. Response was:", text);
        throw new Error("Server did not return JSON. Check the API route.");
      }

      const data = await res.json();
      if (!res.ok) {
        console.error("❌ Backend returned error:", data);
        throw new Error(data.error || data.message || "Failed to save profile");
      }

      console.log("✅ Employee registered successfully:", data);

      // Save role and full name in localStorage
      // ✅ Store full name consistently
      const fullName = profile.fullName || "";
      localStorage.setItem("userFullName", fullName);
      setUserFullName(fullName);

      // ✅ Store role consistently
      const role = profile.requestAdminAccess ? "admin" : "staff";
      localStorage.setItem("userRole", role);
      setUserRole(role);
      // ✅ update state immediately

      // Redirect
      if (profile.requestAdminAccess) {
        router.push("/admin-dashboard");
      } else {
        router.push("/staff");
      }
    } catch (err) {
      console.error("❌ Error submitting staff profile:", err);
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
                      onKeyDown={handleKeyDown}
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    {phoneError && (
                      <div className="invalid-feedback d-block">
                        {phoneError}
                      </div>
                    )}
                  </div>
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
                    className="btn btn-primary-600 w-100"
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
