import { useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addRepair } from "./repair.api";

const emptyForm = {
  product_id: "",
  issue: "",
  repair_type: "",
  repair_price: "",
  estimated_time: "",
};

export default function RepairDashboard() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      await addRepair(form);
      setMessage("Repair record added!");
      setForm(emptyForm);
    } catch (err) {
      setMessage(err.response?.data?.error || "Error adding repair");
    }
  };

  return (
    <DashboardLayout title="Add Repair Record">
      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">
          {message}
        </div>
      )}

      <div className="bg-white shadow rounded p-6 w-full max-w-lg">
        <div className="flex flex-col gap-4">
          <input className="border p-2 rounded" placeholder="Product ID"
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Issue description"
            value={form.issue}
            onChange={(e) => setForm({ ...form, issue: e.target.value })} />
          <select className="border p-2 rounded"
            value={form.repair_type}
            onChange={(e) => setForm({ ...form, repair_type: e.target.value })}>
            <option value="">Select repair type</option>
            <option value="HARDWARE">Hardware</option>
            <option value="SOFTWARE">Software</option>
            <option value="COSMETIC">Cosmetic</option>
            <option value="OTHER">Other</option>
          </select>
          <input className="border p-2 rounded" placeholder="Repair price (BDT)"
            type="number"
            value={form.repair_price}
            onChange={(e) => setForm({ ...form, repair_price: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Estimated time (e.g. 2 days)"
            value={form.estimated_time}
            onChange={(e) => setForm({ ...form, estimated_time: e.target.value })} />
          <button onClick={handleSubmit}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700">
            Submit Repair Record
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}