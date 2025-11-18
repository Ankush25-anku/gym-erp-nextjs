import AddExpenses from "../../../components/AddExpenses";

import MasterLayout from "../../../masterLayout/MasterLayout";
import React from "react";

const page = () => {
  return (
    <div>
      <MasterLayout>
        <AddExpenses />
      </MasterLayout>
    </div>
  );
};

export default page;
