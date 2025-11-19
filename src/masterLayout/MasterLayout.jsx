"use client";
import { useState, useEffect, useRef } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import { Icon } from "@iconify/react/dist/iconify.js";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useUser, useAuth } from "@clerk/nextjs";
import axios from "axios"; // ✅ make sure axios is imported

const API_BASE = "http://localhost:5000";
const   MasterLayout = ({ children }) => {
  const pathname = usePathname();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, isLoaded } = useUser();
  const { getToken, signOut, isLoaded: authLoaded, isSignedIn } = useAuth();

  const [profile, setProfile] = useState(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [showClerkDetails, setShowClerkDetails] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showJoinGym, setShowJoinGym] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [isValidCode, setIsValidCode] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [joinedGymCode, setJoinedGymCode] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [storedGymCode, setStoredGymCode] = useState("");
  const [pendingGyms, setPendingGyms] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const joinGymRef = useRef(null);
  const hasFetchedRef = useRef(false);
  const intervalRef = useRef(null);

  const dropdownRef = useRef(null);

  const [profileImage, setProfileImage] = useState(
    "/assets/images/profile/profile.jpg"
  );

  const [staffSalaryOpen, setStaffSalaryOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  const handleToggleStaffSalary = () => {
    setStaffSalaryOpen(!staffSalaryOpen);
  };
  const handleToggleInventory = () => setInventoryOpen(!inventoryOpen);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userRole = localStorage.getItem("userRole");
    const clerkData = JSON.parse(localStorage.getItem("__clerk_db_jwt"));
    const currentEmail = clerkData?.user?.email || "";

    // Try to get from localStorage first
    const storedImage = localStorage.getItem(
      `profileImage_${userRole}_${currentEmail}`
    );

    if (storedImage) {
      setProfileImage(storedImage);
      console.log("🖼️ Loaded profile image from localStorage:", storedImage);
    } else {
      // If not found locally, fetch from backend
      (async () => {
        try {
          const token = await getToken();
          const res = await axios.get(`${API_BASE}/api/supergyms/joined`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.data?.joinedGym?.profileImage) {
            const imageUrl = res.data.joinedGym.profileImage;
            setProfileImage(imageUrl);
            localStorage.setItem(
              `profileImage_${userRole}_${currentEmail}`,
              imageUrl
            );
            console.log("🌐 Fetched and saved profile image:", imageUrl);
          }
        } catch (err) {
          console.error("⚠️ Failed to fetch profile image:", err);
        }
      })();
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("userRole");
      if (storedRole) setUserRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCode = localStorage.getItem("gymCode");
      if (savedCode) setStoredGymCode(savedCode);
    }
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem("expenseDropdownOpen");
    if (savedState === "true") setExpenseOpen(true);
  }, []);

  // ✅ Auto-open dropdown if current path is under `/expenses`
  useEffect(() => {
    if (pathname.startsWith("/expenses")) {
      setExpenseOpen(true);
      localStorage.setItem("expenseDropdownOpen", "true");
    }
  }, [pathname]);

  // ✅ Toggle and remember dropdown state
  const handleToggleExpense = () => {
    const newState = !expenseOpen;
    setExpenseOpen(newState);
    localStorage.setItem("expenseDropdownOpen", newState.toString());
  };

  // ✅ Fetch approval status (client + safe Clerk token)

  // ✅ Send approval request (Admin → SuperAdmin)

  // ✅ Fetch all pending gyms (SuperAdmin)

  //   try {
  //     const token = await getToken();
  //     await axios.post(
  //       `/api/gym/approval/approve/${id}`,
  //       {},
  //       {
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     alert("Gym approved!");
  //     fetchPendingGyms();
  //   } catch (err) {
  //     console.error("Error approving gym:", err);
  //   }
  // };

  // Inside your component

  // Load userRole and userFullName from localStorage first
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLoaded || !user) return;

    // 1️⃣ Read userRole and name from localStorage
    const role = localStorage.getItem("userRole") || "user";
    const storedName = localStorage.getItem("userFullName");

    setUserRole(role);
    if (storedName) setUserFullName(storedName);

    // 2️⃣ Now read joined gym code for this user + role
    const currentEmail = user.primaryEmailAddress.emailAddress;
    const gymKey = `joinedGymCode_${role}_${currentEmail}`;
    const storedCode = localStorage.getItem(gymKey);

    console.log("Stored gym code from localStorage:", storedCode);

    if (storedCode && storedCode !== "null" && storedCode !== "undefined") {
      setJoinedGymCode(storedCode);
      setShowJoinGym(false);
    } else {
      setJoinedGymCode(""); // Fresh join
      setShowJoinGym(true); // Show Join Gym button
      setEnteredCode("");
      setIsValidCode(false);
      setValidationMessage("");
    }
  }, [isLoaded, user]);

  // Don't render until role is loaded

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (joinGymRef.current && !joinGymRef.current.contains(event.target)) {
        setShowJoinGym(false);
      }
    };
    if (showJoinGym) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showJoinGym]);

  // Fetch ClerkUser profile
  useEffect(() => {
    if (isLoaded && user) fetchProfile();
  }, [isLoaded, user]);

  const fetchProfile = async () => {
    if (!authLoaded || !isSignedIn) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/clerkusers/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleButtonClick = async () => {
    await fetchProfile();
    setIsSidebarOpen(true);
  };

  const toggleSidebar = () => setSidebarActive(!sidebarActive);
  // const toggleMobileMenu = () => setMobileMenu(!mobileMenu);

  const toggleMobileMenu = () => {
    setMobileMenu((prev) => !prev); // toggles between open & closed
  };

  // Redirect if role not set
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) window.location.href = "/login";
  }, []);

  // Dropdown logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedDropdown = event.currentTarget.closest(".dropdown");
      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      // Close all
      document.querySelectorAll(".sidebar-menu .dropdown").forEach((d) => {
        d.classList.remove("open");
        const submenu = d.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = "0px";
      });

      // Open clicked
      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = `${submenu.scrollHeight}px`;
      }
    };

    const triggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );
    triggers.forEach((t) => t.addEventListener("click", handleDropdownClick));

    // Auto-open active route submenu
    const openActiveDropdown = () => {
      document
        .querySelectorAll(".sidebar-menu .dropdown")
        .forEach((dropdown) => {
          const links = dropdown.querySelectorAll(".sidebar-submenu li a");
          links.forEach((link) => {
            if (link.getAttribute("href") === pathname) {
              dropdown.classList.add("open");
              const submenu = dropdown.querySelector(".sidebar-submenu");
              if (submenu)
                submenu.style.maxHeight = `${submenu.scrollHeight}px`;
            }
          });
        });
    };
    openActiveDropdown();

    return () =>
      triggers.forEach((t) =>
        t.removeEventListener("click", handleDropdownClick)
      );
  }, [pathname]);

  // ✅ Load saved gym from localStorage on mount
  // Reset gym info when a new user logs in
  useEffect(() => {
    console.log(
      "useEffect triggered: isLoaded, user, userRole",
      isLoaded,
      user,
      userRole
    );

    if (!isLoaded || !user) return;

    // ✅ Step 1: Get stored role and email
    const storedRole = localStorage.getItem("userRole") || "user";
    if (!userRole) setUserRole(storedRole);

    const currentEmail = user.primaryEmailAddress.emailAddress;
    console.log("currentEmail:", currentEmail);

    // ✅ Step 2: Retrieve joined gym code
    const gymKey = `joinedGymCode_${storedRole}_${currentEmail}`;
    const storedCode = localStorage.getItem(gymKey);
    console.log("Stored gym code from localStorage:", storedCode);

    if (storedCode && storedCode !== "null" && storedCode !== "undefined") {
      setJoinedGymCode(storedCode);
      setShowJoinGym(false);

      // ✅ Step 3: Retrieve and set gym profile image
      const profileKey = `profileImage_${storedCode}_${storedRole}_${currentEmail}`;
      const storedProfileImage = localStorage.getItem(profileKey);

      if (storedProfileImage) {
        console.log("Loaded gym profile image:", storedProfileImage);
        setProfileImage(storedProfileImage);
      } else {
        console.log("No gym profile image found, using default");
        setProfileImage("/assets/images/profile/profile.jpg");
      }
    } else {
      // ✅ No gym joined yet → reset states
      setJoinedGymCode("");
      setShowJoinGym(true);
      setEnteredCode("");
      setIsValidCode(false);
      setValidationMessage("");
      setProfileImage("/assets/images/profile/profile.jpg");
    }
  }, [isLoaded, user, userRole]);

  useEffect(() => {
    const handleStorageChange = () => {
      console.log(
        "🔁 Storage event detected — updating sidebar image and gym code..."
      );
      const storedRole = localStorage.getItem("userRole");
      const currentEmail = user?.primaryEmailAddress?.emailAddress;

      if (!storedRole || !currentEmail) return;

      const joinedCode = localStorage.getItem(
        `joinedGymCode_${storedRole}_${currentEmail}`
      );
      const profileKey = `profileImage_${joinedCode}_${storedRole}_${currentEmail}`;
      const newProfileImage = localStorage.getItem(profileKey);

      if (joinedCode) setJoinedGymCode(joinedCode);
      if (newProfileImage) setProfileImage(newProfileImage);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  // ✅ Send approval request to Admin (for Staff join)
  // ✅ 1️⃣ Send approval request (Admin → SuperAdmin)
  const handleSendApprovalRequest = async (gymCode) => {
    try {
      console.log(
        "📨 Sending Admin → SuperAdmin approval for gymCode:",
        gymCode
      );

      const token = await getToken();
      if (!token) return alert("⚠️ Authentication failed. Please login again.");

      // ✅ Try to get fullName from localStorage first
      const storedFullName = localStorage.getItem("userFullName");
      const fullName =
        storedFullName?.trim() ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        "Unknown Admin";

      const requesterEmail = user?.primaryEmailAddress?.emailAddress;

      const payload = {
        gymCode,
        fullName, // ✅ send actual full name
        requesterEmail,
        adminEmail: requesterEmail,
        clerkRole: "admin",
        role: "admin",
      };

      console.log("📦 Admin → SuperAdmin Payload:", payload);

      const res = await axios.post(`${API_BASE}/api/gym/request`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📩 Response from /api/gym/request:", res.data);

      if (res.data?.success) {
        console.log("✅ Admin approval request sent successfully!");
        setApprovalStatus("pending");
        return true;
      } else {
        alert(res.data?.message || "❌ Failed to send admin request.");
        return false;
      }
    } catch (err) {
      console.error("❌ Error sending Admin approval:", err);
      alert("⚠️ Something went wrong while sending admin approval.");
      return false;
    }
  };

  // ✅ 2️⃣ Send approval request (Staff → Admin)
  const handleSendStaffApprovalRequest = async (gymCode) => {
    try {
      console.log("📨 Sending Staff → Admin approval for gymCode:", gymCode);

      const token = await getToken();
      if (!token) {
        alert("⚠️ Authentication failed. Please login again.");
        return false;
      }

      // ✅ Try to get fullName from localStorage first
      const storedFullName = localStorage.getItem("userFullName");
      const fullName =
        storedFullName?.trim() ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        "Unknown Staff";

      const requesterEmail = user?.primaryEmailAddress?.emailAddress;

      const payload = {
        gymCode,
        fullName, // ✅ actual staff name
        requesterEmail,
        adminEmail: "", // leave blank since this is staff’s request
        clerkRole: "staff",
        role: "staff",
      };

      console.log("📦 Staff → Admin Payload:", payload);

      const res = await axios.post(`${API_BASE}/api/gym/request`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📩 Response from /api/gym/request:", res.data);

      if (res.data?.success) {
        console.log("✅ Staff approval request sent successfully!");
        setApprovalStatus("pending");
        return true;
      } else {
        alert(res.data?.message || "❌ Failed to send staff request.");
        return false;
      }
    } catch (err) {
      console.error("❌ Error sending Staff approval:", err);
      alert(
        err.response?.data?.message ||
          "⚠️ Something went wrong while sending staff approval."
      );
      return false;
    }
  };

  // ✅ Member → Admin Approval Request
  // ✅ Member → Admin approval request
  const handleSendMemberApprovalRequest = async (gymCode) => {
    try {
      console.log("📨 Sending Member → Admin approval for gymCode:", gymCode);

      const token = await getToken();
      if (!token) {
        alert("⚠️ Authentication failed. Please login again.");
        return false;
      }

      // ✅ Get full name
      const storedFullName = localStorage.getItem("userFullName");
      const fullName =
        storedFullName?.trim() ||
        `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
        "Unknown Member";

      const requesterEmail = user?.primaryEmailAddress?.emailAddress;

      const payload = {
        gymCode,
        fullName,
        requesterEmail,
        adminEmail: "", // backend can set this based on gym’s admin
        clerkRole: "member",
        role: "member",
      };

      console.log("📦 Member → Admin Payload:", payload);

      const res = await axios.post(`${API_BASE}/api/gym/request`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📩 Response from /api/gym/request:", res.data);

      if (res.data?.success) {
        console.log("✅ Member approval request sent successfully!");
        setApprovalStatus("pending");
        return true;
      } else {
        console.warn("⚠️ Failed to send member approval:", res.data);
        alert(
          res.data?.message || "❌ Failed to send member approval request."
        );
        return false;
      }
    } catch (err) {
      console.error("❌ Error sending Member approval:", err);
      alert(
        err.response?.data?.message ||
          "⚠️ Something went wrong while sending member approval."
      );
      return false;
    }
  };

  const handleSubmitJoin = async () => {
    if (!enteredCode.trim()) return;

    try {
      console.log("🏋️ handleSubmitJoin called with enteredCode:", enteredCode);
      const token = await getToken();
      if (!token) return alert("No auth token found. Please login again.");

      const normalizedCode = enteredCode.trim().toUpperCase();
      console.log("🔤 Normalized gym code:", normalizedCode);

      // ✅ STEP 1: Fetch the gym details (to get its profile image)
      const gymRes = await axios.get(
        `${API_BASE}/api/supergyms/code/${normalizedCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const gym = gymRes.data.gym;
      console.log("🏋️ Gym fetched:", gym);

      // ✅ STEP 2: Use gym’s uploaded image or fallback to default
      const uploadedImageUrl =
        gym?.profileImage || "/assets/images/profile/profile.jpg";

      // ✅ STEP 3: Join the gym
      const res = await axios.post(
        `${API_BASE}/api/supergyms/join`,
        {
          gymCode: normalizedCode,
          profileImage: uploadedImageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📬 Response from /supergyms/join:", res.data);

      if (res.data.success || res.data.message?.includes("Already joined")) {
        const currentEmail = user.primaryEmailAddress.emailAddress;
        const role = userRole || localStorage.getItem("userRole");

        // ✅ Store gym code
        const gymKey = `joinedGymCode_${role}_${currentEmail}`;
        localStorage.setItem(gymKey, normalizedCode);

        // ✅ Store profile image
        const profileKey = `profileImage_${normalizedCode}_${role}_${currentEmail}`;
        const finalImage =
          res.data.profileImage ||
          uploadedImageUrl ||
          "/assets/images/profile/profile.jpg";

        localStorage.setItem(profileKey, finalImage);

        // ✅ Instantly update the sidebar state (🔥 immediate UI update)
        setProfileImage(finalImage);
        setJoinedGymCode(normalizedCode);

        // ✅ Notify other tabs & listeners (like your storage effect)
        window.dispatchEvent(new Event("storage"));

        // ✅ Clean up modal & reset fields
        setShowJoinGym(false);
        setEnteredCode("");
        setIsValidCode(false);
        setValidationMessage("");

        // ✅ Send approval request depending on role
        console.log("📨 Sending approval request for role:", role);
        let approvalSent = false;

        if (role?.toLowerCase() === "admin") {
          approvalSent = await handleSendApprovalRequest(normalizedCode);
        } else if (role?.toLowerCase() === "staff") {
          approvalSent = await handleSendStaffApprovalRequest(normalizedCode);
        } else if (role?.toLowerCase() === "member") {
          approvalSent = await handleSendMemberApprovalRequest(normalizedCode);
        }

        if (approvalSent) {
          alert("🎉 Successfully joined the gym and approval request sent!");
        } else {
          alert("⚠️ Joined gym, but failed to send approval request.");
        }
      } else {
        alert(`❌ Failed to join gym: ${res.data.message}`);
      }
    } catch (err) {
      console.error("❌ Error joining gym:", err);
      alert("❌ Something went wrong while joining gym.");
    }
  };

  // ✅ 3️⃣ Check gym code validity
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
        `${API_BASE}/api/supergyms/verify-code`,
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
      console.error("⚠️ Error verifying gym code:", err);
      setIsValidCode(false);
      setValidationMessage("⚠️ Error verifying gym code.");
    }
  };

  // ✅ 4️⃣ Join gym & trigger proper approval flow

  const fetchApprovalStatus = async (gymCode) => {
    try {
      const token = await getToken();
      if (!token) return;

      const role = userRole?.toLowerCase();
      let endpoint;

      // 🔄 Choose correct API endpoint based on role
      if (role === "admin") {
        endpoint = `${API_BASE}/api/gym/approval-status/${gymCode}`; // admin → superadmin
      } else if (role === "staff") {
        endpoint = `${API_BASE}/api/gym/staff-approval-status/${gymCode}`; // staff → admin
      } else if (role === "member") {
        endpoint = `${API_BASE}/api/gym/member-approval-status/${gymCode}`; // 👈 NEW route for member
      } else {
        console.warn("⚠️ Unknown role — cannot fetch approval status");
        return;
      }

      console.log("📩 Approval status API called");
      console.log("🔹 gymCode:", gymCode);
      console.log("🔹 userRole:", role);
      console.log("🔹 endpoint:", endpoint);

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success && res.data.approvalStatus) {
        console.log("✅ Approval status fetched:", res.data.approvalStatus);
        setApprovalStatus(res.data.approvalStatus);
      } else {
        console.warn("⚠️ No approval status found; setting pending.");
        setApprovalStatus("pending");
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.warn("⚠️ 404: Approval status not found for", gymCode);
        setApprovalStatus("pending");
      } else {
        console.error("❌ Error fetching approval status:", err);
      }
    }
  };

  // ✅ Polling effect (fixed)
  useEffect(() => {
    if (!joinedGymCode || !userRole) return;

    // Prevent duplicate setup
    if (hasFetchedRef.current) {
      console.log("⏭️ Skipping duplicate approval-status setup...");
      return;
    }
    hasFetchedRef.current = true;

    console.log("🚀 Starting approval status polling for gym:", joinedGymCode);

    // Initial fetch
    fetchApprovalStatus(joinedGymCode);

    // Polling every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchApprovalStatus(joinedGymCode);
    }, 5000);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Clearing approval status interval...");
      clearInterval(intervalRef.current);
    };
  }, [joinedGymCode, userRole]);

  const fetchAllRequests = async () => {
    try {
      const token = await getToken();
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!token || !email) return;

      // Get gymCode for logged-in admin
      const gymRes = await axios.get(`${API_BASE}/api/gym/admin/${email}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gymCode = gymRes.data?.gymCode;
      if (!gymCode) {
        console.warn("⚠️ No gymCode found for admin:", email);
        return;
      }

      // Fetch all requests for that gym
      const reqRes = await axios.get(
        `${API_BASE}/api/gym/approval/gym/${gymCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Requests for gym:", gymCode, reqRes.data);
      setAllRequests(reqRes.data);
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn("⚠️ No requests found for this gym.");
        setAllRequests([]);
      } else {
        console.error("❌ Error fetching gym requests:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update status (approve/reject)
  const handleStatusUpdate = async (id, status) => {
    try {
      const token = await getToken();
      await axios.put(
        `${API_BASE}/api/gym/approval/update-status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✅ Updated status for ${id} → ${status}`);
      // Refresh list immediately
      fetchAllRequests();
    } catch (err) {
      console.error("❌ Error updating status:", err);
    }
  };

  useEffect(() => {
    fetchAllRequests();
    const interval = setInterval(fetchAllRequests, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const getUserRoleLabel = () => {
    if (userRole === "superadmin") return "Super Admin";
    if (userRole === "staff") return "Staff";
    if (userRole === "admin") return "Admin";
    if (userRole === "member") return "Member";
    return "User";
  };

  // Get display name
  const getUserDisplayName = () => {
    if (userFullName) return userFullName; // always use state if available

    // fallback logic
    if (userRole === "staff") {
      if (profile?.fullName) return profile.fullName;
      if (user?.firstName) return user.firstName;
      return "Staff";
    }

    if (userRole === "admin") {
      // ✅ if staff requested admin, show full name
      if (profile?.fullName) return profile.fullName;
      if (user?.firstName) return user.firstName;
      return "Admin";
    }

    if (userRole === "superadmin") {
      if (profile?.fullName) return profile.fullName;
      if (user?.firstName) return user.firstName;
      return "Super Admin";
    }

    if (userRole === "member") {
      if (profile?.fullName) return profile.fullName;
      if (user?.firstName) return user.firstName;
      return "Member";
    }

    return profile?.fullName || user?.firstName || "User";
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem("userRole"); // clear role
      localStorage.removeItem("userFullName");
      await signOut({ redirectUrl: "/login" });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <section className={mobileMenu ? "overlay active" : "overlay"}>
      {/* Sidebar */}
      <aside
        className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}
        style={{
          width: "250px",
          backgroundColor: "#fff",
          borderRight: "1px solid #eaeaea",
          minHeight: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 9999,
          transition: "transform 0.3s ease-in-out",
          transform:
            typeof window !== "undefined" && window.innerWidth < 992
              ? mobileMenu
                ? "translateX(0)"
                : "translateX(-100%)"
              : "translateX(0)", // ✅ always visible on desktop
          boxShadow: "2px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <Link href="/" className="sidebar-logo">
            <img
              src="/assets/images/logo.png"
              alt="site logo"
              className="light-logo"
            />
            <img
              src="/assets/images/logo-light.png"
              alt="site logo"
              className="dark-logo"
            />
            <img
              src="/assets/images/logo-icon.png"
              alt="site logo"
              className="logo-icon"
            />
          </Link>
        </div>

        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {/* Admin Sidebar */}
            {/* Admin Sidebar */}
            {userRole === "admin" && (
              <>
                {/* ================= ADMIN SIDEBAR ================= */}
                <aside
                  className={`sidebar ${sidebarActive ? "active" : ""}`}
                  style={{
                    width: "250px",
                    backgroundColor: "#fff",
                    borderRight: "1px solid #eaeaea",
                    minHeight: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    transition: "all 0.3s ease",
                    zIndex: 9999,
                    overflowY: "auto",
                    boxShadow: "2px 0 8px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* === Mobile Close Button === */}
                  <button
                    onClick={toggleMobileMenu}
                    type="button"
                    className="btn-close position-absolute top-3 end-3 d-md-none"
                  ></button>

                  {/* === Profile + Gym Section === */}
                  <div
                    className="sidebar-profile-section d-flex flex-column align-items-center p-3 border-bottom"
                    style={{ gap: "10px", textAlign: "center" }}
                  >
                    <img
                      src={profileImage || "/assets/images/profile/profile.jpg"}
                      alt="Gym Profile"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        border: "2px solid #ddd",
                        objectFit: "cover",
                        marginBottom: "5px",
                        transition: "opacity 0.3s ease-in-out",
                      }}
                      onError={(e) =>
                        (e.target.src = "/assets/images/profile/profile.jpg")
                      }
                    />

                    {joinedGymCode ? (
                      <div
                        className="d-flex align-items-center gap-2 fw-bold text-success"
                        style={{
                          fontSize: "14px",
                          background: "#E8F5E9",
                          padding: "6px 10px",
                          borderRadius: "8px",
                        }}
                      >
                        🏋️ {joinedGymCode}
                        {approvalStatus === "pending" && (
                          <span
                            title="Pending Approval"
                            style={{ fontSize: "12px" }}
                          >
                            ⏳
                          </span>
                        )}
                        {approvalStatus === "approved" && (
                          <span
                            title="Approved"
                            style={{ fontSize: "12px", color: "green" }}
                          >
                            ✅
                          </span>
                        )}
                        {approvalStatus === "rejected" && (
                          <span
                            title="Rejected"
                            style={{ fontSize: "12px", color: "red" }}
                          >
                            ❌
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => setShowJoinGym(true)}
                      >
                        Join Gym
                      </button>
                    )}
                  </div>

                  {/* === Sidebar Menu === */}
                  <ul className="sidebar-menu mt-3 px-2" id="sidebar-menu">
                    <li>
                      <Link
                        href="/admin-dashboard"
                        className={
                          pathname === "/admin-dashboard" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="solar:home-smile-angle-outline"
                          className="menu-icon"
                        />
                        <span>Dashboard</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/attendance"
                        className={
                          pathname === "/attendance" ? "active-page" : ""
                        }
                      >
                        <Icon icon="bi:calendar-check" className="menu-icon" />
                        <span>Attendance</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/staff-attendance"
                        className={
                          pathname === "/staff-attendance" ? "active-page" : ""
                        }
                      >
                        <Icon icon="bi:people-fill" className="menu-icon" />
                        <span>Staff Attendance</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/StaffMonthlyAttendance"
                        className={
                          pathname === "/StaffMonthlyAttendance"
                            ? "active-page"
                            : ""
                        }
                      >
                        <Icon icon="mdi:calendar-month" className="menu-icon" />
                        <span>Staff Monthly Attendance</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/staff-requests"
                        className={
                          pathname === "/staff-requests" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:account-tie-outline"
                          className="menu-icon"
                        />
                        <span>Staff Requests</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/member-requests"
                        className={
                          pathname === "/member-requests" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:account-outline"
                          className="menu-icon"
                        />
                        <span>Member Requests</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/members"
                        className={pathname === "/members" ? "active-page" : ""}
                      >
                        <Icon
                          icon="mdi:account-multiple"
                          className="menu-icon"
                        />
                        <span>Members</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/AdminMemberPayments"
                        className={
                          pathname === "/AdminMemberPayments"
                            ? "active-page"
                            : ""
                        }
                      >
                        <Icon icon="mdi:cash" className="menu-icon" />
                        <span>Admin Member Payments</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/trainers"
                        className={
                          pathname === "/trainers" ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:weight-lifter" className="menu-icon" />
                        <span>Trainers</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/plans"
                        className={pathname === "/plans" ? "active-page" : ""}
                      >
                        <Icon
                          icon="mdi:credit-card-outline"
                          className="menu-icon"
                        />
                        <span>Plans</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/schedule"
                        className={
                          pathname === "/schedule" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:calendar-outline"
                          className="menu-icon"
                        />
                        <span>Schedule</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/admin-staff"
                        className={
                          pathname === "/admin-staff" ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:account-tie" className="menu-icon" />
                        <span>Staff</span>
                      </Link>
                    </li>

                    {/* === Expense Dropdown === */}
                    <li className="dropdown">
                      <button
                        className="sidebar-dropdown-btn d-flex justify-content-between align-items-center w-100"
                        onClick={handleToggleExpense}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#333",
                          fontWeight: "500",
                          fontSize: "15px",
                          padding: "10px 15px",
                        }}
                      >
                        <span>
                          <Icon
                            icon="mdi:cash-multiple"
                            className="menu-icon"
                          />
                          Expense
                        </span>
                        {expenseOpen ? (
                          <FaChevronUp size={14} />
                        ) : (
                          <FaChevronDown size={14} />
                        )}
                      </button>

                      <ul
                        className={`submenu list-unstyled ps-4 mt-1 ${
                          expenseOpen ? "show" : "collapse"
                        }`}
                        style={{
                          maxHeight: expenseOpen ? "400px" : "0",
                          overflow: "hidden",
                          transition: "max-height 0.3s ease-in-out",
                        }}
                      >
                        <li>
                          <Link
                            href="/expenses/expense-category"
                            className={`d-block py-2 ${
                              pathname === "/expenses/expense-category"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-primary-600 w-auto me-2" />
                            Expense Category
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/expenses/add-expense"
                            className={`d-block py-2 ${
                              pathname === "/expenses/add-expense"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-warning-main w-auto me-2" />
                            Add Expense
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/expenses/show-expense"
                            className={`d-block py-2 ${
                              pathname === "/expenses/show-expense"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-info-main w-auto me-2" />
                            Show Expense
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/expenses/monthly-payment-mode"
                            className={`d-block py-2 ${
                              pathname === "/expenses/monthly-payment-mode"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-danger-main w-auto me-2" />
                            Monthly Payment Mode
                          </Link>
                        </li>
                      </ul>
                    </li>

                    <li className="dropdown">
                      <button
                        className="sidebar-dropdown-btn d-flex justify-content-between align-items-center w-100"
                        onClick={handleToggleStaffSalary}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#333",
                          fontWeight: "500",
                          fontSize: "15px",
                          padding: "10px 15px",
                        }}
                      >
                        <span>
                          <Icon icon="mdi:account-cash" className="menu-icon" />
                          Staff Salary
                        </span>
                        {staffSalaryOpen ? (
                          <FaChevronUp size={14} />
                        ) : (
                          <FaChevronDown size={14} />
                        )}
                      </button>

                      <ul
                        className={`submenu list-unstyled ps-4 mt-1 ${
                          staffSalaryOpen ? "show" : "collapse"
                        }`}
                        style={{
                          maxHeight: staffSalaryOpen ? "400px" : "0",
                          overflow: "hidden",
                          transition: "max-height 0.3s ease-in-out",
                        }}
                      >
                        <li>
                          <Link
                            href="/staff-salary/staff-salary-category"
                            className={`d-block py-2 ${
                              pathname === "/staff-salary/staff-salary-category"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-primary-600 w-auto me-2" />
                            Staff Salary Category
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/staff-salary/set-salary"
                            className={`d-block py-2 ${
                              pathname === "/staff-salary/set-salary"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-warning-main w-auto me-2" />
                            Set Salary
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/staff-salary/staff-month-salary"
                            className={`d-block py-2 ${
                              pathname === "/staff-salary/staff-month-salary"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-info-main w-auto me-2" />
                            Staff Month Salary
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/staff-salary/staff-monthly-salary"
                            className={`d-block py-2 ${
                              pathname === "/staff-salary/staff-monthly-salary"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-danger-main w-auto me-2" />
                            Staff Monthly Salary
                          </Link>
                        </li>
                      </ul>
                    </li>

                    <li>
                      <Link
                        href="/gym"
                        className={pathname === "/gym" ? "active-page" : ""}
                      >
                        <Icon
                          icon="mdi:office-building-outline"
                          className="menu-icon"
                        />
                        <span>Gym</span>
                      </Link>
                    </li>

                    <li className="dropdown">
                      <button
                        className="sidebar-dropdown-btn d-flex justify-content-between align-items-center w-100"
                        onClick={handleToggleInventory}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#333",
                          fontWeight: "500",
                          fontSize: "15px",
                          padding: "10px 15px",
                        }}
                      >
                        <span>
                          <Icon
                            icon="mdi:package-variant"
                            className="menu-icon"
                          />
                          Inventory
                        </span>
                        {inventoryOpen ? (
                          <FaChevronUp size={14} />
                        ) : (
                          <FaChevronDown size={14} />
                        )}
                      </button>

                      <ul
                        className={`submenu list-unstyled ps-4 mt-1 ${
                          inventoryOpen ? "show" : "collapse"
                        }`}
                        style={{
                          maxHeight: inventoryOpen ? "300px" : "0",
                          overflow: "hidden",
                          transition: "max-height 0.3s ease-in-out",
                        }}
                      >
                        <li>
                          <Link
                            href="/inventory/summary"
                            className={`d-block py-2 ${
                              pathname === "/inventory/summary"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-primary-600 w-auto me-2" />
                            Inventory Summary
                          </Link>
                        </li>

                        <li>
                          <Link
                            href="/inventory/items"
                            className={`d-block py-2 ${
                              pathname === "/inventory/items"
                                ? "active-page"
                                : ""
                            }`}
                          >
                            <i className="ri-circle-fill circle-icon text-warning-main w-auto me-2" />
                            Inventory Items
                          </Link>
                        </li>
                      </ul>
                    </li>

                    <li>
                      <Link
                        href="/income"
                        className={pathname === "/income" ? "active-page" : ""}
                      >
                        <Icon icon="mdi:wallet-outline" className="menu-icon" />
                        <span>Income</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/notifications"
                        className={
                          pathname === "/notifications" ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:bell-outline" className="menu-icon" />
                        <span>Notifications</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/payments"
                        className={
                          pathname === "/payments" ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:cash-fast" className="menu-icon" />
                        <span>Payments</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/rolespermission"
                        className={
                          pathname === "/rolespermission" ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:lock-outline" className="menu-icon" />
                        <span>Roles & Permissions</span>
                      </Link>
                    </li>
                  </ul>
                </aside>
              </>
            )}

            {/* Trainer Sidebar */}
            {typeof window !== "undefined" &&
              localStorage.getItem("userRole") === "trainer" && (
                <>
                  <li>
                    <Link
                      href="/trainer"
                      className={pathname === "/trainer" ? "active-page" : ""}
                    >
                      <Icon
                        icon="solar:home-smile-angle-outline"
                        className="menu-icon"
                      />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/trainer/attendance"
                      className={
                        pathname === "/trainer/attendance" ? "active-page" : ""
                      }
                    >
                      <Icon icon="bi:calendar-check" className="menu-icon" />
                      <span>Attendance</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/trainer/members"
                      className={
                        pathname === "/trainer/members" ? "active-page" : ""
                      }
                    >
                      <Icon icon="bi:people-fill" className="menu-icon" />
                      <span>My Members</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/trainer/schedule"
                      className={
                        pathname === "/trainer/schedule" ? "active-page" : ""
                      }
                    >
                      <Icon icon="bi:calendar2-week" className="menu-icon" />
                      <span>Schedule</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/trainer/workoutplan"
                      className={
                        pathname === "/trainer/workoutplan" ? "active-page" : ""
                      }
                    >
                      <Icon icon="mdi:weight-lifter" className="menu-icon" />
                      <span>Workout Plan</span>
                    </Link>
                  </li>
                </>
              )}

            {/* Member Sidebar */}
            {userRole === "member" && (
              <>
                <aside
                  className={`sidebar ${sidebarActive ? "active" : ""}`}
                  style={{
                    width: "250px",
                    backgroundColor: "#fff",
                    borderRight: "1px solid #eaeaea",
                    minHeight: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    transition: "all 0.3s ease",
                    zIndex: 9999,
                  }}
                >
                  {/* Close Button for Mobile */}
                  <button
                    onClick={toggleMobileMenu}
                    type="button"
                    className="btn-close position-absolute top-3 end-3 d-md-none"
                  ></button>

                  {/* 🧍‍♂️ Profile + Join Gym Section */}
                  <div
                    className="sidebar-profile-section d-flex flex-column align-items-center p-3 border-bottom"
                    style={{ gap: "10px", textAlign: "center" }}
                  >
                    {/* Small Profile Image */}

                    <img
                      src={profileImage || "/assets/images/profile/profile.jpg"}
                      alt="Gym Profile"
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        border: "2px solid #ddd",
                        objectFit: "cover",
                        marginBottom: "5px",
                        transition: "opacity 0.3s ease-in-out",
                      }}
                      onError={(e) => {
                        e.target.src = "/assets/images/profile/profile.jpg"; // fallback
                      }}
                    />
                    <h5 className="mt-2">{profile?.fullName || "Member"}</h5>

                    {/* 🏋️ Joined Gym Code or Join Button */}
                    {joinedGymCode &&
                    joinedGymCode !== "null" &&
                    joinedGymCode !== "undefined" ? (
                      <div
                        className="d-flex align-items-center gap-2 fw-bold text-success"
                        style={{
                          fontSize: "14px",
                          background: "#E8F5E9",
                          padding: "6px 10px",
                          borderRadius: "8px",
                        }}
                      >
                        🏋️ {joinedGymCode}
                        {approvalStatus === "pending" && (
                          <span
                            title="Waiting for Admin approval"
                            style={{ fontSize: "12px" }}
                          >
                            ⏳
                          </span>
                        )}
                        {approvalStatus === "approved" && (
                          <span
                            title="Approved by Admin"
                            style={{ fontSize: "12px", color: "green" }}
                          >
                            ✅
                          </span>
                        )}
                        {approvalStatus === "rejected" && (
                          <span
                            title="Rejected by Admin"
                            style={{ fontSize: "12px", color: "red" }}
                          >
                            ❌
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-3"
                        onClick={() => setShowJoinGym(true)}
                      >
                        Join Gym
                      </button>
                    )}
                  </div>

                  {/* 🪄 Join Gym Modal */}
                  {showJoinGym && (
                    <div
                      className="join-gym-overlay"
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 9999,
                      }}
                    >
                      <div
                        ref={joinGymRef}
                        className="join-gym-modal shadow-lg"
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: "10px",
                          padding: "20px",
                          width: "350px",
                          position: "relative",
                          animation: "fadeIn 0.2s ease-in-out",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0 fw-bold">Join Gym</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setShowJoinGym(false)}
                          ></button>
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
                          className="form-control mb-3"
                          autoFocus
                        />

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-primary w-50"
                            onClick={handleCheckCode}
                            disabled={!enteredCode.trim()}
                          >
                            Check Code
                          </button>

                          {isValidCode && (
                            <button
                              className="btn btn-sm btn-success w-50"
                              onClick={async () => {
                                await handleSubmitJoin(); // ✅ Join gym request
                                setApprovalStatus("pending");
                              }}
                            >
                              Submit
                            </button>
                          )}
                        </div>

                        <button
                          className="btn btn-sm btn-secondary mt-2 w-100"
                          onClick={() => setShowJoinGym(false)}
                        >
                          Cancel
                        </button>

                        {validationMessage && (
                          <p
                            className={`mt-3 text-center fw-semibold ${
                              isValidCode ? "text-success" : "text-danger"
                            }`}
                          >
                            {validationMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 📋 Sidebar Menu */}
                  <ul className="sidebar-menu mt-3 px-2" id="sidebar-menu">
                    <li>
                      <Link
                        href="/member/dashboard"
                        className={
                          pathname === "/member/dashboard" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="solar:home-smile-angle-outline"
                          className="menu-icon"
                        />
                        <span>Dashboard</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/member/my-progress"
                        className={
                          pathname === "/member/my-progress"
                            ? "active-page"
                            : ""
                        }
                      >
                        <Icon icon="mdi:chart-line" className="menu-icon" />
                        <span>My Progress</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        href="/member/payment"
                        className={
                          pathname === "/member/payment" ? "active-page" : ""
                        }
                      >
                        <Icon icon="mdi:chart-line" className="menu-icon" />
                        <span>payment</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/member/attendance"
                        className={
                          pathname === "/member/attendance" ? "active-page" : ""
                        }
                      >
                        <Icon icon="bi:calendar-check" className="menu-icon" />
                        <span>Attendance</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/member/schedule"
                        className={
                          pathname === "/member/schedule" ? "active-page" : ""
                        }
                      >
                        <Icon icon="bi:calendar2-week" className="menu-icon" />
                        <span>Schedule</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/member/memberworkoutplan"
                        className={
                          pathname === "/member/memberworkoutplan"
                            ? "active-page"
                            : ""
                        }
                      >
                        <Icon icon="bi:dumbbell" className="menu-icon" />
                        <span>Workout Plan</span>
                      </Link>
                    </li>
                  </ul>
                </aside>
              </>
            )}
          </ul>

          {/* Superadmin Sidebar */}
          {typeof window !== "undefined" &&
            localStorage.getItem("userRole") === "superadmin" && (
              <aside
                className={`superadmin-sidebar ${
                  sidebarActive ? "active" : ""
                }`}
                style={{
                  width: "250px",
                  backgroundColor: "#fff",
                  borderRight: "1px solid #eaeaea",
                  minHeight: "100vh",
                  position: "fixed",
                  left: 0,
                  top: 0,
                  transition: "all 0.3s ease",
                  zIndex: 1000,
                  overflowY: "auto",
                  boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
                }}
              >
                {/* Mobile close button */}
                <button
                  onClick={toggleMobileMenu}
                  type="button"
                  className="btn-close position-absolute top-3 end-3 d-md-none"
                ></button>

                {/* Profile + Gym Code */}
                <div
                  className="sidebar-profile-section d-flex flex-column align-items-center p-3 border-bottom"
                  style={{ gap: "8px" }}
                >
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: "50px",
                      height: "50px",
                      objectFit: "cover",
                    }}
                    onError={(e) =>
                      (e.target.src = "/assets/images/profile/profile.jpg")
                    }
                  />

                  {joinedGymCode ? (
                    <span
                      className="btn btn-sm btn-success"
                      style={{
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        padding: "2px 8px",
                      }}
                    >
                      Gym: {joinedGymCode} ✅
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowJoinGym(true)}
                      className="btn btn-sm btn-primary"
                      style={{
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        padding: "2px 8px",
                      }}
                    >
                      Join Gym
                    </button>
                  )}
                </div>

                {/* Menu */}
                <nav className="mt-3 px-2">
                  <ul className="sidebar-menu" id="sidebar-menu">
                    {/* Dashboard */}
                    <li className="dropdown">
                      <Link href="#">
                        <Icon
                          icon="solar:home-smile-angle-outline"
                          className="menu-icon"
                        />
                        <span>Dashboard</span>
                      </Link>
                      <ul className="sidebar-submenu">
                        <li>
                          <Link
                            href="/superadmin"
                            className={
                              pathname === "/superadmin" ? "active-page" : ""
                            }
                          >
                            <i className="ri-circle-fill circle-icon text-primary-600 w-auto" />
                            Dashboard Home
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/superadmin/requests"
                            className={
                              pathname === "/superadmin/requests"
                                ? "active-page"
                                : ""
                            }
                          >
                            <Icon
                              icon="mdi:clipboard-check-outline"
                              className="menu-icon"
                            />
                            <span>Requests</span>
                          </Link>
                        </li>

                        <li>
                          <Link
                            href="/superadmin/allrequests"
                            className={
                              pathname === "/superadmin/allrequests"
                                ? "active-page"
                                : ""
                            }
                          >
                            <Icon
                              icon="mdi:clipboard-check-outline"
                              className="menu-icon"
                            />
                            <span> All Requests</span>
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Application Section */}
                    <li className="sidebar-menu-group-title">Application</li>
                    <li>
                      <Link
                        href="/superadmin/users"
                        className={
                          pathname === "/superadmin/users" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:account-multiple-outline"
                          className="menu-icon"
                        />
                        <span>Users</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/superadmin/gyms"
                        className={
                          pathname === "/superadmin/gyms" ? "active-page" : ""
                        }
                      >
                        <Icon
                          icon="mdi:office-building-outline"
                          className="menu-icon"
                        />
                        <span>Gyms</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/superadmin/addgyms"
                        className={
                          pathname === "/superadmin/addgyms"
                            ? "active-page"
                            : ""
                        }
                      >
                        <Icon
                          icon="mdi:plus-box-outline"
                          className="menu-icon"
                        />
                        <span>Add Gym</span>
                      </Link>
                    </li>

                    {/* Settings */}
                    <li className="sidebar-menu-group-title">Settings</li>
                    <li className="dropdown">
                      <Link href="#">
                        <Icon
                          icon="icon-park-outline:setting-two"
                          className="menu-icon"
                        />
                        <span>Settings</span>
                      </Link>
                      <ul className="sidebar-submenu">
                        <li>
                          <Link
                            href="/superadmin/profile"
                            className={
                              pathname === "/superadmin/profile"
                                ? "active-page"
                                : ""
                            }
                          >
                            <i className="ri-circle-fill circle-icon text-primary-600 w-auto" />{" "}
                            Profile
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/superadmin/notifications"
                            className={
                              pathname === "/superadmin/notifications"
                                ? "active-page"
                                : ""
                            }
                          >
                            <i className="ri-circle-fill circle-icon text-warning-main w-auto" />{" "}
                            Notifications
                          </Link>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </nav>
              </aside>
            )}

          {/* Join Gym Modal */}
          {showJoinGym && (
            <div
              className="join-gym-overlay"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
              }}
            >
              <div
                ref={joinGymRef}
                className="join-gym-modal shadow-lg"
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "10px",
                  padding: "20px",
                  width: "350px",
                  position: "relative",
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Join Gym</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowJoinGym(false)}
                  ></button>
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
                  className="form-control mb-3"
                  autoFocus
                />

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-primary w-50"
                    onClick={handleCheckCode}
                    disabled={!enteredCode.trim()}
                  >
                    Check Code
                  </button>
                  {isValidCode && (
                    <button
                      className="btn btn-sm btn-success w-50"
                      onClick={handleSubmitJoin}
                    >
                      Submit
                    </button>
                  )}
                </div>

                <button
                  className="btn btn-sm btn-secondary mt-2 w-100"
                  onClick={() => setShowJoinGym(false)}
                >
                  Cancel
                </button>

                {validationMessage && (
                  <p
                    className={`mt-3 text-center fw-semibold ${
                      isValidCode ? "text-success" : "text-danger"
                    }`}
                  >
                    {validationMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Staff Sidebar */}
          {/* Staff Sidebar */}
          {/* --- Staff Sidebar --- */}
          {userRole === "staff" && (
            <>
              <aside
                className={`sidebar ${sidebarActive ? "active" : ""}`}
                style={{
                  width: "250px",
                  backgroundColor: "#fff",
                  borderRight: "1px solid #eaeaea",
                  minHeight: "100vh",
                  position: "fixed",
                  left: 0,
                  top: 0,
                  transition: "all 0.3s ease",
                  zIndex: 9999,
                }}
              >
                {/* Close Button for mobile */}
                <button
                  onClick={toggleMobileMenu}
                  type="button"
                  className="btn-close position-absolute top-3 end-3 d-md-none"
                ></button>

                {/* 🧍‍♂️ Profile + Join Gym Section */}
                <div
                  className="sidebar-profile-section d-flex flex-column align-items-center p-3 border-bottom"
                  style={{ gap: "10px", textAlign: "center" }}
                >
                  <img
                    src={profileImage || "/assets/images/profile/profile.jpg"}
                    alt="Profile"
                    className="rounded-circle"
                    style={{
                      width: "60px",
                      height: "60px",
                      border: "2px solid #ddd",
                      objectFit: "cover",
                      marginBottom: "5px",
                      transition: "opacity 0.3s ease-in-out",
                    }}
                    onError={(e) => {
                      e.target.src = "/assets/images/profile/profile.jpg";
                    }}
                  />
                  <h5 className="mt-2">{profile?.fullName || "Staff"}</h5>

                  {/* 🏋️ Joined Gym Code or Join Button */}
                  {joinedGymCode &&
                  joinedGymCode !== "null" &&
                  joinedGymCode !== "undefined" ? (
                    <div
                      className="d-flex align-items-center gap-2 fw-bold text-success"
                      style={{
                        fontSize: "14px",
                        background: "#E8F5E9",
                        padding: "6px 10px",
                        borderRadius: "8px",
                      }}
                    >
                      🏋️ {joinedGymCode}
                      {approvalStatus === "pending" && (
                        <span
                          title="Waiting for Admin approval"
                          style={{ fontSize: "12px" }}
                        >
                          ⏳
                        </span>
                      )}
                      {approvalStatus === "approved" && (
                        <span
                          title="Approved by Admin"
                          style={{ fontSize: "12px", color: "green" }}
                        >
                          ✅
                        </span>
                      )}
                      {approvalStatus === "rejected" && (
                        <span
                          title="Rejected by Admin"
                          style={{ fontSize: "12px", color: "red" }}
                        >
                          ❌
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm btn-outline-primary rounded-pill px-3"
                      onClick={() => setShowJoinGym(true)}
                    >
                      Join Gym
                    </button>
                  )}
                </div>

                {/* 🪄 Join Gym Modal */}
                {showJoinGym && (
                  <div
                    className="join-gym-overlay"
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      width: "100vw",
                      height: "100vh",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 9999,
                    }}
                  >
                    <div
                      ref={joinGymRef}
                      className="join-gym-modal shadow-lg"
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: "10px",
                        padding: "20px",
                        width: "350px",
                        position: "relative",
                        animation: "fadeIn 0.2s ease-in-out",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0 fw-bold">Join Gym</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={() => setShowJoinGym(false)}
                        ></button>
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
                        className="form-control mb-3"
                        autoFocus
                      />

                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-primary w-50"
                          onClick={handleCheckCode}
                          disabled={!enteredCode.trim()}
                        >
                          Check Code
                        </button>

                        {isValidCode && (
                          <button
                            className="btn btn-sm btn-success w-50"
                            onClick={async () => {
                              await handleSubmitJoin(); // ✅ Joins gym
                              setApprovalStatus("pending");

                              // 🔁 Immediately trigger sidebar update
                              const currentEmail =
                                user?.primaryEmailAddress?.emailAddress;
                              const storedRole =
                                localStorage.getItem("userRole");
                              const joinedCodeKey = `joinedGymCode_${storedRole}_${currentEmail}`;
                              const joinedCode =
                                localStorage.getItem(joinedCodeKey);

                              if (joinedCode) {
                                const profileKey = `profileImage_${joinedCode}_${storedRole}_${currentEmail}`;
                                const newProfileImage =
                                  localStorage.getItem(profileKey);
                                if (newProfileImage) {
                                  setProfileImage(newProfileImage);
                                }
                                setJoinedGymCode(joinedCode);
                              }
                            }}
                          >
                            Submit
                          </button>
                        )}
                      </div>

                      <button
                        className="btn btn-sm btn-secondary mt-2 w-100"
                        onClick={() => setShowJoinGym(false)}
                      >
                        Cancel
                      </button>

                      {validationMessage && (
                        <p
                          className={`mt-3 text-center fw-semibold ${
                            isValidCode ? "text-success" : "text-danger"
                          }`}
                        >
                          {validationMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 📋 Sidebar Menu */}
                <ul className="sidebar-menu mt-3 px-2" id="sidebar-menu">
                  <li>
                    <Link
                      href="/staff/dashboard"
                      className={
                        pathname === "/staff/dashboard" ? "active-page" : ""
                      }
                    >
                      <Icon
                        icon="solar:home-smile-angle-outline"
                        className="menu-icon"
                      />
                      <span>Dashboard</span>
                    </Link>
                  </li>

                  {/* <li>
                <Link
                  href="/staff/attendance"
                  className={
                    pathname === "/staff/attendance" ? "active-page" : ""
                  }
                >
                  <Icon icon="bi:calendar-check" className="menu-icon" />
                  <span>Attendance</span>
                </Link>
              </li> */}
                  <li>
                    <Link
                      href="/staff/StaffAttendanceCalendar"
                      className={
                        pathname === "/staff/StaffAttendanceCalendar"
                          ? "active-page"
                          : ""
                      }
                    >
                      <Icon icon="bi:calendar-check" className="menu-icon" />
                      <span>Attendance</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/staff/members"
                      className={
                        pathname === "/staff/members" ? "active-page" : ""
                      }
                    >
                      <Icon icon="bi:people-fill" className="menu-icon" />
                      <span>Members</span>
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/staff/plans"
                      className={
                        pathname === "/staff/plans" ? "active-page" : ""
                      }
                    >
                      <Icon
                        icon="mdi:credit-card-outline"
                        className="menu-icon"
                      />
                      <span>Plans</span>
                    </Link>
                  </li>
                </ul>
              </aside>
            </>
          )}
        </div>
      </aside>

      {mobileMenu && (
        <div
          className="mobile-overlay"
          onClick={toggleMobileMenu}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9998,
          }}
        />
      )}

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={toggleSidebar} // <-- use the existing toggle function
                >
                  {sidebarActive ? (
                    <Icon
                      icon="iconoir:arrow-right"
                      className="icon text-2xl non-active"
                    />
                  ) : (
                    <Icon
                      icon="heroicons:bars-3-solid"
                      className="icon text-2xl non-active "
                    />
                  )}
                </button>
                <button
                  onClick={toggleMobileMenu} // <-- use the existing toggle function
                  type="button"
                  className="sidebar-mobile-toggle"
                >
                  <Icon icon="heroicons:bars-3-solid" className="icon" />
                </button>

                <form className="navbar-search">
                  <input type="text" name="search" placeholder="Search" />
                  <Icon icon="ion:search-outline" className="icon" />
                </form>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* ThemeToggleButton */}
                <ThemeToggleButton />
                <div className="dropdown d-none d-sm-inline-block">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src="/assets/images/lang-flag.png"
                      alt="Wowdash"
                      className="w-24 h-24 object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Choose Your Language
                        </h6>
                      </div>
                    </div>
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-8">
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="english"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag1.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              English
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="english"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="japan"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag2.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Japan
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="japan"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="france"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag3.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              France
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="france"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="germany"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag4.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Germany
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="germany"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="korea"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag5.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              South Korea
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="korea"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="bangladesh"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag6.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Bangladesh
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="bangladesh"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="india"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag7.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              India
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="india"
                        />
                      </div>
                      <div className="form-check style-check d-flex align-items-center justify-content-between">
                        <label
                          className="form-check-label line-height-1 fw-medium text-secondary-light"
                          htmlFor="canada"
                        >
                          <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                            <img
                              src="/assets/images/flags/flag8.png"
                              alt=""
                              className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                            />
                            <span className="text-md fw-semibold mb-0">
                              Canada
                            </span>
                          </span>
                        </label>
                        <input
                          className="form-check-input"
                          type="radio"
                          name="crypto"
                          id="canada"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Language dropdown end */}
                <div className="dropdown">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <Icon
                      icon="mage:email"
                      className="text-primary-light text-xl"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-lg p-0">
                    <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Message
                        </h6>
                      </div>
                      <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                        05
                      </span>
                    </div>
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-40-px h-40-px rounded-circle flex-shrink-0 position-relative">
                            <img
                              src="/assets/images/notification/profile-3.png"
                              alt=""
                            />
                            <span className="w-8-px h-8-px bg-success-main rounded-circle position-absolute end-0 bottom-0" />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Kathryn Murphy
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-100-px">
                              hey! there i’m...
                            </p>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <span className="text-sm text-secondary-light flex-shrink-0">
                            12:30 PM
                          </span>
                          <span className="mt-4 text-xs text-base w-16-px h-16-px d-flex justify-content-center align-items-center bg-warning-main rounded-circle">
                            8
                          </span>
                        </div>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-40-px h-40-px rounded-circle flex-shrink-0 position-relative">
                            <img
                              src="/assets/images/notification/profile-4.png"
                              alt=""
                            />
                            <span className="w-8-px h-8-px  bg-neutral-300 rounded-circle position-absolute end-0 bottom-0" />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Kathryn Murphy
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-100-px">
                              hey! there i’m...
                            </p>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <span className="text-sm text-secondary-light flex-shrink-0">
                            12:30 PM
                          </span>
                          <span className="mt-4 text-xs text-base w-16-px h-16-px d-flex justify-content-center align-items-center bg-warning-main rounded-circle">
                            2
                          </span>
                        </div>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-40-px h-40-px rounded-circle flex-shrink-0 position-relative">
                            <img
                              src="/assets/images/notification/profile-5.png"
                              alt=""
                            />
                            <span className="w-8-px h-8-px bg-success-main rounded-circle position-absolute end-0 bottom-0" />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Kathryn Murphy
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-100-px">
                              hey! there i’m...
                            </p>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <span className="text-sm text-secondary-light flex-shrink-0">
                            12:30 PM
                          </span>
                          <span className="mt-4 text-xs text-base w-16-px h-16-px d-flex justify-content-center align-items-center bg-neutral-400 rounded-circle">
                            0
                          </span>
                        </div>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-40-px h-40-px rounded-circle flex-shrink-0 position-relative">
                            <img
                              src="/assets/images/notification/profile-6.png"
                              alt=""
                            />
                            <span className="w-8-px h-8-px bg-neutral-300 rounded-circle position-absolute end-0 bottom-0" />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Kathryn Murphy
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-100-px">
                              hey! there i’m...
                            </p>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <span className="text-sm text-secondary-light flex-shrink-0">
                            12:30 PM
                          </span>
                          <span className="mt-4 text-xs text-base w-16-px h-16-px d-flex justify-content-center align-items-center bg-neutral-400 rounded-circle">
                            0
                          </span>
                        </div>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-40-px h-40-px rounded-circle flex-shrink-0 position-relative">
                            <img
                              src="/assets/images/notification/profile-7.png"
                              alt=""
                            />
                            <span className="w-8-px h-8-px bg-success-main rounded-circle position-absolute end-0 bottom-0" />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Kathryn Murphy
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-100-px">
                              hey! there i’m...
                            </p>
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <span className="text-sm text-secondary-light flex-shrink-0">
                            12:30 PM
                          </span>
                          <span className="mt-4 text-xs text-base w-16-px h-16-px d-flex justify-content-center align-items-center bg-warning-main rounded-circle">
                            8
                          </span>
                        </div>
                      </Link>
                    </div>
                    <div className="text-center py-12 px-16">
                      <Link
                        href="#"
                        className="text-primary-600 fw-semibold text-md"
                      >
                        See All Message
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Message dropdown end */}
                <div className="dropdown">
                  <button
                    className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <Icon
                      icon="iconoir:bell"
                      className="text-primary-light text-xl"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-lg p-0">
                    <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-0">
                          Notifications
                        </h6>
                      </div>
                      <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">
                        05
                      </span>
                    </div>
                    <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <Icon
                              icon="bitcoin-icons:verify-outline"
                              className="icon text-xxl"
                            />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Congratulations
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-200-px">
                              Your profile has been Verified. Your profile has
                              been Verified
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-secondary-light flex-shrink-0">
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <img
                              src="/assets/images/notification/profile-1.png"
                              alt=""
                            />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Ronald Richards
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-200-px">
                              You can stitch between artboards
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-secondary-light flex-shrink-0">
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-44-px h-44-px bg-info-subtle text-info-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            AM
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Arlene McCoy
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-200-px">
                              Invite you to prototyping
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-secondary-light flex-shrink-0">
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            <img
                              src="/assets/images/notification/profile-2.png"
                              alt=""
                            />
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Annette Black
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-200-px">
                              Invite you to prototyping
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-secondary-light flex-shrink-0">
                          23 Mins ago
                        </span>
                      </Link>
                      <Link
                        href="#"
                        className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between"
                      >
                        <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <span className="w-44-px h-44-px bg-info-subtle text-info-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                            DR
                          </span>
                          <div>
                            <h6 className="text-md fw-semibold mb-4">
                              Darlene Robertson
                            </h6>
                            <p className="mb-0 text-sm text-secondary-light text-w-200-px">
                              Invite you to prototyping
                            </p>
                          </div>
                        </div>
                        <span className="text-sm text-secondary-light flex-shrink-0">
                          23 Mins ago
                        </span>
                      </Link>
                    </div>
                    <div className="text-center py-12 px-16">
                      <Link
                        href="#"
                        className="text-primary-600 fw-semibold text-md"
                      >
                        See All Notification
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Notification dropdown end */}
                <div className="dropdown position-relative" ref={dropdownRef}>
                  {/* Avatar Button */}
                  <button
                    className="btn rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "45px",
                      height: "45px",
                      backgroundColor:
                        userRole === "staff" ? "#2E7D32" : "#1976D2",
                      color: "#fff",
                      border: "none",
                    }}
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    {getUserDisplayName()?.[0]}
                  </button>

                  {/* Dropdown Card */}
                  {isOpen && (
                    <div
                      className="position-absolute end-0 mt-2 bg-white shadow-lg rounded-3 p-3"
                      style={{ width: "260px", zIndex: 1050 }}
                    >
                      {/* Profile Header */}
                      <div
                        className="d-flex justify-content-between align-items-center px-3 py-2 mb-3"
                        style={{
                          backgroundColor: "#FFFFFF", // ✅ always white
                          borderRadius: "12px",
                        }}
                      >
                        <div>
                          <h6 className="fw-semibold text-dark mb-1">
                            {getUserDisplayName()}
                          </h6>
                          <span
                            className="text-muted"
                            style={{ fontSize: "14px" }}
                          >
                            {getUserRoleLabel()}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm text-dark"
                          onClick={() => setIsOpen(false)}
                        >
                          <Icon icon="radix-icons:cross-1" width={18} />
                        </button>
                      </div>

                      {/* Menu List */}
                      <ul className="list-unstyled mb-0">
                        <li>
                          <Link
                            href="/view-profile"
                            className="d-flex align-items-center gap-3 text-dark py-2 px-2 rounded hover-bg-light"
                          >
                            <Icon
                              icon="solar:user-linear"
                              className="text-xl"
                            />
                            My Profile
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/email"
                            className="d-flex align-items-center gap-3 text-dark py-2 px-2 rounded hover-bg-light"
                          >
                            <Icon
                              icon="tabler:message-check"
                              className="text-xl"
                            />
                            Inbox
                          </Link>
                        </li>
                        <li>
                          <Link
                            href="/company"
                            className="d-flex align-items-center gap-3 text-dark py-2 px-2 rounded hover-bg-light"
                          >
                            <Icon
                              icon="icon-park-outline:setting-two"
                              className="text-xl"
                            />
                            Setting
                          </Link>
                        </li>
                        <li>
                          <button
                            className="d-flex align-items-center gap-3 text-danger py-2 px-2 rounded hover-bg-light w-100 border-0 bg-transparent"
                            onClick={handleLogout}
                          >
                            <Icon icon="lucide:power" className="text-xl" />
                            Log Out
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                {/* Profile dropdown end */}
              </div>
            </div>
          </div>
        </div>

        {/* dashboard-main-body */}
        <div className="dashboard-main-body">{children}</div>

        {/* Footer section */}
        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">© 2025 WowDash. All Rights Reserved.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Made by <span className="text-primary-600">wowtheme7</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;
