"use client";

import { useState } from "react";
import axios from "axios";
import MasterLayout from "../../../masterLayout/MasterLayout";
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function AddGymsPage() {
  const [gymData, setGymData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    pincode: "",
    subscriptionPlan: "",
    status: "active",
    profileImage: "", // ✅ New field
  });
  const [gymCode, setGymCode] = useState("");
  const [uploading, setUploading] = useState(false); // ✅ Upload state
  const { getToken } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGymData({ ...gymData, [name]: value });

    const firstLetter = (name === "name" ? value : gymData.name)
      .charAt(0)
      .toLowerCase();
    const codePincode = name === "pincode" ? value : gymData.pincode;

    if (firstLetter && codePincode) {
      setGymCode(`${firstLetter}-${codePincode}`);
    } else {
      setGymCode("");
    }
  };

  // ✅ Handle image upload to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      setGymData((prev) => ({ ...prev, profileImage: data.secure_url }));
    } catch (error) {
      console.error("❌ Cloudinary upload error:", error);
      alert("Image upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleAddGym = async () => {
    try {
      // 🧩 Step 1: Validation - Check required fields
      const requiredFields = [
        "name",
        "email",
        "phone",
        "address",
        "pincode",
        "subscriptionPlan",
        "profileImage",
      ];

      for (const field of requiredFields) {
        if (!gymData[field] || gymData[field].trim() === "") {
          alert(
            `Please enter ${field === "profileImage" ? "Gym Image" : field}`
          );
          return;
        }
      }

      if (!gymCode) {
        alert("Gym Code is missing. Please check the name and pincode fields.");
        return;
      }

      const token = await getToken();
      if (!token) {
        alert("No auth token found. Please login again.");
        return;
      }

      // 🧩 Step 2: Submit if all valid
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/supergyms/add`,
        { ...gymData, gymCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 🧩 Step 3: Handle response
      if (response.data.success) {
        alert("Gym added successfully!");
        setGymData({
          name: "",
          email: "",
          phone: "",
          address: "",
          pincode: "",
          subscriptionPlan: "",
          status: "active",
          profileImage: "",
        });
        setGymCode("");
      } else {
        alert("Failed to add gym: " + response.data.message);
      }
    } catch (err) {
      console.error("❌ Error adding gym:", err);
      alert("Failed to add gym. Please check your details and try again.");
    }
  };

  return (
    <MasterLayout>
      <div className="p-4 d-flex justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0">🏋️‍♂️ Add Gym</h5>
            </div>

            <div className="card-body">
              {/* Gym Name */}
              <div className="text-center mb-4">
                <label
                  className="form-label fw-semibold d-block mb-2"
                  style={{
                    fontSize: "1rem",
                    color: "#212529", // neutral dark gray text
                  }}
                >
                  Gym Image
                </label>

                <div>
                  <input
                    type="file"
                    id="gymImageUpload"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="gymImageUpload"
                    className="btn border btn-light px-3 py-1 fw-semibold"
                    style={{
                      cursor: "pointer",
                      borderRadius: "6px",
                      backgroundColor: "#fff",
                      color: "#212529",
                      borderColor: "#ced4da",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      transition: "all 0.2s ease-in-out",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f9fa";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                  >
                    Upload Image
                  </label>
                </div>

                {uploading && (
                  <div className="text-muted small mt-2">Uploading...</div>
                )}

                {gymData.profileImage && (
                  <div className="mt-3">
                    <img
                      src={gymData.profileImage}
                      alt="Gym"
                      className="img-thumbnail rounded-3 shadow-sm"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        borderColor: "#dee2e6",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">Gym Name</label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="mdi:dumbbell" />
                    </span>
                    <input
                      type="text"
                      name="name"
                      value={gymData.name}
                      onChange={handleInputChange}
                      placeholder="Enter Gym Name"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Image Upload */}
              {/* Gym Image Upload - styled like example */}

              {/* Email */}
              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">Email</label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="mdi:email-outline" />
                    </span>
                    <input
                      type="email"
                      name="email"
                      value={gymData.email}
                      onChange={handleInputChange}
                      placeholder="Enter Email"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">Phone</label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="solar:phone-calling-linear" />
                    </span>
                    <input
                      type="text"
                      name="phone"
                      value={gymData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">Address</label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="mdi:map-marker-outline" />
                    </span>
                    <input
                      type="text"
                      name="address"
                      value={gymData.address}
                      onChange={handleInputChange}
                      placeholder="Enter Address"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Pincode */}
              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">Pincode</label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="mdi:location-enter" />
                    </span>
                    <input
                      type="text"
                      name="pincode"
                      value={gymData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter Pincode"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan */}
              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">
                  Subscription Plan
                </label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="mdi:wallet-membership" />
                    </span>
                    <input
                      type="text"
                      name="subscriptionPlan"
                      value={gymData.subscriptionPlan}
                      onChange={handleInputChange}
                      placeholder="Enter Plan (e.g. Premium)"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>

              {/* Auto Gym Code */}
              <div className="row mb-3 align-items-center">
                <label className="form-label mb-0 col-sm-3">Gym Code</label>
                <div className="col-sm-9">
                  <div className="icon-field">
                    <span className="icon">
                      <Icon icon="mdi:qrcode-scan" />
                    </span>
                    <input
                      type="text"
                      name="gymCode"
                      value={gymCode}
                      readOnly
                      className="form-control bg-light"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-end mt-4">
                <button
                  type="button"
                  className="btn btn-primary px-4 py-2"
                  onClick={handleAddGym}
                  disabled={uploading}
                >
                  <Icon icon="mdi:check-circle-outline" className="me-1" />
                  {uploading ? "Uploading..." : "Add Gym"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}
