import SalaryWithAttendance from "../../../components/staff-month-salary";
import MasterLayout from "../../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <SalaryWithAttendance />
      </MasterLayout>
    </div>
  );
};

export default page;
