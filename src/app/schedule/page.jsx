"use client";
import React from "react";
import MasterLayout from "../../masterLayout/MasterLayout";// ✅ Import your layout
import AdminSchedule from "../../components/child/AdminSchedule"; // ✅ Existing component

const RolesPermissionPage = () => {
  return (
    <MasterLayout>
      <AdminSchedule />
    </MasterLayout>
  );
};

export default RolesPermissionPage;
