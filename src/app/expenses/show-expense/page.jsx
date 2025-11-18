import ExpenseSummary from "../../../components/ExpenseSummary";
import MasterLayout from "../../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <ExpenseSummary />
      </MasterLayout>
    </div>
  );
};

export default page;
