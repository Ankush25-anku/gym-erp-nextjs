"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";

export default function MemberProfilePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState(""); // ✅ validation state

  const [profileData, setProfileData] = useState({
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
    membershipGoal: "",
  });

  // ✅ Auto-fill Clerk data
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

  // ✅ Input handler (with phone validation)
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "phone") {
      const numericValue = value.replace(/\D/g, ""); // remove non-digits

      // ✅ Validation messages
      if (/[^0-9]/.test(value)) {
        setPhoneError("Please type only numbers (0–9)");
      } else if (numericValue.length > 10) {
        setPhoneError("Phone number cannot exceed 10 digits");
      } else if (numericValue.length < 10 && numericValue.length > 0) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else {
        setPhoneError("");
      }

      setProfileData((p) => ({ ...p, phone: numericValue }));
      return;
    }

    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () =>
        setProfileData((p) => ({ ...p, imageUrl: reader.result }));
      reader.readAsDataURL(files[0]);
    } else {
      setProfileData((p) => ({ ...p, [name]: value }));
    }
  };

  // ✅ Block non-numeric keypresses
  const handleKeyDown = (e) => {
    if (!/[0-9]|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) {
      e.preventDefault();
      setPhoneError("Only numeric input allowed (0–9)");
    } else {
      setPhoneError("");
    }
  };

  // ✅ Save profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Validate phone before submitting
    if (!/^\d{10}$/.test(profileData.phone)) {
      setLoading(false);
      setPhoneError("Please enter a valid 10-digit phone number.");
      return;
    }

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
          body: JSON.stringify({ ...profileData, role: "member" }),
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to save member profile");

      localStorage.setItem("userRole", "member");
      localStorage.setItem("userFullName", profileData.fullName);

      // ✅ Redirect to member dashboard
      router.push("/member");
    } catch (err) {
      console.error("Error saving member profile:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="col-md-8 mx-auto">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-header bg-success text-white text-center rounded-top-4">
            <h4 className="mb-0">Complete Your Member Profile</h4>
          </div>

          <div className="card-body p-4">
            {/* Profile Image */}
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
                    {(profileData.fullName || "M").charAt(0)}
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
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Full Name */}
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    name="fullName"
                    className="form-control"
                    placeholder="Your Name"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="info@gmail.com"
                    value={profileData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Phone */}
                <div className="col-md-6">
                  <label className="form-label">Phone Number</label>
                  <input
                    name="phone"
                    type="text"
                    className={`form-control ${phoneError ? "is-invalid" : ""}`}
                    placeholder="Enter 10-digit number"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                  {phoneError && (
                    <div className="invalid-feedback d-block">{phoneError}</div>
                  )}
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

                {/* Membership Goal */}
                <div className="col-md-6">
                  <label className="form-label">Fitness Goal</label>
                  <input
                    name="membershipGoal"
                    className="form-control"
                    placeholder="Weight loss, Muscle gain, etc."
                    value={profileData.membershipGoal}
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

                {/* City / State / Country / Zip */}
                <div className="col-md-6">
                  <label className="form-label">City</label>
                  <input
                    name="city"
                    className="form-control"
                    value={profileData.city}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">State</label>
                  <input
                    name="state"
                    className="form-control"
                    value={profileData.state}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Country</label>
                  <input
                    name="country"
                    className="form-control"
                    value={profileData.country}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Zip Code</label>
                  <input
                    name="zipcode"
                    className="form-control"
                    value={profileData.zipcode}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Submit */}
                <div className="col-12 mt-4">
                  <button
                    type="submit"
                    className="btn btn-success w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save & Continue"}
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
