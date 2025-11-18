import AdminMemberPayments from "../../components/AdminMemberPayments";
import MasterLayout from "../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <AdminMemberPayments />
      </MasterLayout>
    </div>
  );
};

export default page;
