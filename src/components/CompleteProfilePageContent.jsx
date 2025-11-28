"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";

export default function CompleteProfilePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleQuery = searchParams.get("role");
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(roleQuery || "");
  const [phoneError, setPhoneError] = useState("");

  const [profileData, setProfileData] = useState({
    gymCode: "",
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    imageUrl: "",
    additionalInfo: "",
    requestAdminAccess: false,
  });

  // ✅ Step 1: Store Clerk userId in localStorage for WebView & send to React Native
  useEffect(() => {
    if (isUserLoaded && user) {
      const clerkUserId = user.id;
      localStorage.setItem("userId", clerkUserId); // ✅ allow WebView to read it
      console.log("🧠 Clerk User ID saved:", clerkUserId);

      // ✅ Actively send userId to React Native WebView
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ userId: clerkUserId })
        );
        console.log("📲 Clerk userId posted to React Native");
      }
    }
  }, [isUserLoaded, user]);

  // ✅ Auto-fill logged-in user data
  useEffect(() => {
    if (isUserLoaded && user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl || "",
      }));
    }
  }, [isUserLoaded, user]);

  // ✅ Handle inputs properly + Phone validation
  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (type === "checkbox") {
      setProfileData((p) => ({ ...p, [name]: checked }));
    } else if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () =>
        setProfileData((p) => ({ ...p, imageUrl: reader.result }));
      reader.readAsDataURL(files[0]);
    } else if (name === "phone") {
      let numericValue = value.replace(/\D/g, "");

      if (numericValue.length > 10) {
        setPhoneError("Please enter only 10 digits");
      } else if (numericValue.length < 10 && numericValue.length > 0) {
        setPhoneError("Phone number must be 10 digits");
      } else {
        setPhoneError("");
      }

      setProfileData((p) => ({ ...p, phone: numericValue }));
    } else {
      setProfileData((p) => ({ ...p, [name]: value }));
    }
  };

  // ✅ Submit profile data
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!/^\d{10}$/.test(profileData.phone)) {
      setLoading(false);
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit phone number."
      );
      return;
    }

    const roleRedirect = {
      superadmin: "/memberRole/dashboard",
      admin: "/admin-dashboard",
      member: "/member/dashboard",
      staff: "/staff/dashboard",
    };

    try {
      const token = await getToken();
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        }/api/clerkusers/sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...profileData, role }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");

      // ✅ Save role and fullName consistently
      localStorage.setItem("userFullName", profileData.fullName.trim());
      localStorage.setItem("userRole", role); // store exact role key ✅

      console.log("✅ Profile saved!");

      router.push(roleRedirect[role] || "/");
    } catch (err) {
      console.error("❌ Profile Sync Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="col-md-8 mx-auto">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-header bg-success text-white text-center rounded-top-4">
            <h4 className="mb-0">Complete Your Profile</h4>
          </div>

          <div className="card-body p-4">
            {/* Avatar Upload */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                {profileData.imageUrl ? (
                  <img
                    src={profileData.imageUrl}
                    alt="Profile"
                    className="rounded-circle border border-3 border-success"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                    style={{
                      width: "100px",
                      height: "100px",
                      fontSize: "32px",
                    }}
                  >
                    {(profileData.fullName || "A").charAt(0)}
                  </div>
                )}

                <label
                  className="btn btn-sm btn-light position-absolute bottom-0 end-0 border"
                  style={{ borderRadius: "50%" }}
                >
                  <Icon icon="mdi:camera" width={18} />
                  <input
                    type="file"
                    accept="image/*"
                    name="imageUrl"
                    onChange={handleInputChange}
                    hidden
                  />
                </label>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProfile}>
              <div className="row g-3">
                {/* Gym Code */}
                <div className="col-md-6">
                  <label className="form-label">Gym Code (Optional)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <Icon icon="mdi:dumbbell" />
                    </span>
                    <input
                      name="gymCode"
                      className="form-control"
                      placeholder="GYM Code"
                      value={profileData.gymCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <Icon icon="mdi:account" />
                    </span>
                    <input
                      name="fullName"
                      className="form-control"
                      placeholder="Full Name"
                      value={profileData.fullName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <Icon icon="mynaui:envelope" />
                    </span>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      placeholder="info@gmail.com"
                      value={profileData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <Icon icon="mdi:phone" />
                    </span>
                    <input
                      name="phone"
                      type="text"
                      className={`form-control ${
                        phoneError ? "is-invalid" : ""
                      }`}
                      placeholder="Enter 10-digit phone number"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                    />
                    {phoneError && (
                      <div className="invalid-feedback">{phoneError}</div>
                    )}
                  </div>
                </div>

                {/* Gender */}
                <div className="col-md-6">
                  <label className="form-label">Gender</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={profileData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* DOB */}
                <div className="col-md-6">
                  <label className="form-label">Date of Birth</label>
                  <input
                    name="dob"
                    type="date"
                    className="form-control"
                    value={profileData.dob}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Address */}
                <div className="col-12">
                  <label className="form-label">Address</label>
                  <input
                    name="address"
                    className="form-control"
                    placeholder="Street, Apartment, etc."
                    value={profileData.address}
                    onChange={handleInputChange}
                  />
                </div>

                {/* City */}
                <div className="col-md-6">
                  <label>City</label>
                  <input
                    name="city"
                    className="form-control"
                    placeholder="City"
                    value={profileData.city}
                    onChange={handleInputChange}
                  />
                </div>

                {/* State */}
                <div className="col-md-6">
                  <label>State</label>
                  <input
                    name="state"
                    className="form-control"
                    placeholder="State"
                    value={profileData.state}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Country */}
                <div className="col-md-6">
                  <label>Country</label>
                  <input
                    name="country"
                    className="form-control"
                    placeholder="Country"
                    value={profileData.country}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Zip Code */}
                <div className="col-md-6">
                  <label>Zip Code</label>
                  <input
                    name="zipcode"
                    className="form-control"
                    placeholder="Zip Code"
                    value={profileData.zipcode}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Additional Info */}
                <div className="col-12">
                  <label>Additional Info</label>
                  <textarea
                    name="additionalInfo"
                    className="form-control"
                    rows={3}
                    placeholder="Write something about yourself..."
                    value={profileData.additionalInfo}
                    onChange={handleInputChange}
                  ></textarea>
                </div>

                {/* Staff Request Checkbox */}
                {role === "staff" && (
                  <div className="col-12 form-check mt-2">
                    <input
                      type="checkbox"
                      name="requestAdminAccess"
                      id="requestAdminAccess"
                      className="form-check-input"
                      checked={profileData.requestAdminAccess}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="requestAdminAccess">
                      Request for Admin Access
                    </label>
                  </div>
                )}

                {/* Submit */}
                <div className="col-12 text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
