import { useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addRepair } from "./repair.api";

export default function RepairDashboard() {
  const [form, setForm] = useState({
    product_id: "",
    issue: "",
  });

  const handleSubmit = async () => {
    await addRepair(form);
    alert("Repair Added");
  };

  return (
    <DashboardLayout title="Add Repair Record">
      <div className="flex flex-col gap-4 w-96">
        <input
          placeholder="Product ID"
          className="border p-2"
          onChange={(e) =>
            setForm({ ...form, product_id: e.target.value })
          }
        />
        <input
          placeholder="Issue"
          className="border p-2"
          onChange={(e) =>
            setForm({ ...form, issue: e.target.value })
          }
        />
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white p-2 rounded"
        >
          Submit Repair
        </button>
      </div>
    </DashboardLayout>
  );
}