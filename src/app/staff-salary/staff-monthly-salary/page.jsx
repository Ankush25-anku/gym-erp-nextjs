import StaffMonthlySalary from "../../../components/staff-monthly-salary";
import MasterLayout from "../../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <StaffMonthlySalary />
      </MasterLayout>
    </div>
  );
};

export default page;
