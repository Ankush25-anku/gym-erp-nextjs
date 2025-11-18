import MemberPaymentsPage from "../../../components/payment";
import MasterLayout from "../../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <MemberPaymentsPage />
      </MasterLayout>
    </div>
  );
};

export default page;
