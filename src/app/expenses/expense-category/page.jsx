import ExpenseCategory from "../../../components/ExpenseCategory";
import MasterLayout from "../../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <ExpenseCategory />
      </MasterLayout>
    </div>
  );
};

export default page;
