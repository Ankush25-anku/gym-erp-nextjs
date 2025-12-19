"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react";

export default function TrainerProfilePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");

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
    specialties: "",
    experience: "",
    certifications: "",
    additionalInfo: "",
  });

  // Auto-fill from Clerk
  useEffect(() => {
    if (isLoaded && user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.primaryEmailAddress?.emailAddress || "",
        imageUrl: user.imageUrl || "",
      }));
    }
  }, [isLoaded, user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, files, type } = e.target;

    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = () =>
        setProfileData((p) => ({ ...p, imageUrl: reader.result }));
      reader.readAsDataURL(files[0]);
      return;
    }

    if (name === "phone") {
      if (/[^0-9]/.test(value)) {
        setPhoneError("Please type only numbers (0–9)");
      } else if (value.length > 10) {
        setPhoneError("Please enter only 10 digits");
      } else if (value.length < 10 && value.length > 0) {
        setPhoneError("Phone number must be 10 digits");
      } else {
        setPhoneError("");
      }

      setProfileData((p) => ({ ...p, phone: value.replace(/\D/g, "") }));
      return;
    }

    setProfileData((p) => ({ ...p, [name]: value }));
  };

  // Submit trainer profile
  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!/^\d{10}$/.test(profileData.phone)) {
      alert("Phone number must be 10 digits.");
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();

      const res = await fetch(`${API_BASE}/api/clerkusers/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to save trainer profile");

      // Save for UI
      localStorage.setItem("userRole", "trainer");
      localStorage.setItem("userFullName", profileData.fullName);

      // Redirect to trainer page
      router.push("/trainer");
    } catch (error) {
      console.error("Error saving trainer profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Form UI (same style as your staff/member profile)
  return (
    <div className="container py-5">
      <div className="col-md-8 mx-auto">
        <div className="card shadow-lg border-0 rounded-4">
          <div className="card-header bg-primary text-white text-center rounded-top-4">
            <h4 className="mb-0">Trainer Profile</h4>
          </div>

          <div className="card-body p-4">
            {/* Avatar Upload */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                {profileData.imageUrl ? (
                  <img
                    src={profileData.imageUrl}
                    alt="Profile"
                    className="rounded-circle border border-3 border-primary"
                    width={100}
                    height={100}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
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
                    hidden
                    onChange={handleInputChange}
                  />
                </label>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitProfile}>
              <div className="row g-3">
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
                      <Icon icon="mdi:email" />
                    </span>
                    <input
                      name="email"
                      type="email"
                      className="form-control"
                      value={profileData.email}
                      readOnly
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
                      className={`form-control ${
                        phoneError ? "is-invalid" : ""
                      }`}
                      maxLength={10}
                      value={profileData.phone}
                      onChange={handleInputChange}
                    />
                    {phoneError && (
                      <div className="invalid-feedback">{phoneError}</div>
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div className="col-md-6">
                  <label className="form-label">Experience (Years)</label>
                  <input
                    name="experience"
                    className="form-control"
                    placeholder="Eg: 3"
                    value={profileData.experience}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Specialties */}
                <div className="col-md-6">
                  <label className="form-label">Specialties</label>
                  <input
                    name="specialties"
                    className="form-control"
                    placeholder="Eg: Strength, Yoga..."
                    value={profileData.specialties}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Certifications */}
                <div className="col-md-6">
                  <label className="form-label">Certifications</label>
                  <input
                    name="certifications"
                    className="form-control"
                    placeholder="Eg: ACE, ISSA"
                    value={profileData.certifications}
                    onChange={handleInputChange}
                  />
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
                    <option value="">Select</option>
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

                {/* Address Fields*/}
                <div className="col-12">
                  <label className="form-label">Address</label>
                  <input
                    name="address"
                    className="form-control"
                    placeholder="Street, area, landmark"
                    value={profileData.address}
                    onChange={handleInputChange}
                  />
                </div>

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

                {/* Additional Info */}
                <div className="col-12">
                  <label className="form-label">Additional Info</label>
                  <textarea
                    name="additionalInfo"
                    className="form-control"
                    rows="3"
                    placeholder="Write something about yourself..."
                    value={profileData.additionalInfo}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Submit */}
                <div className="col-12 text-center mt-3">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2"
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
