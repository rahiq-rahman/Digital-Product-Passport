import { useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getPassport } from "./customer.api";

export default function CustomerDashboard() {
  const [passport, setPassport] = useState(null);
  const [id, setId] = useState("");

  const fetchPassport = async () => {
    const res = await getPassport(id);
    setPassport(res.data);
  };

  return (
    <DashboardLayout title="Digital Product Passport">
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2"
          placeholder="Product ID"
          onChange={(e) => setId(e.target.value)}
        />
        <button
          onClick={fetchPassport}
          className="bg-purple-600 text-white px-4 rounded"
        >
          View Passport
        </button>
      </div>

      {passport && (
        <div className="bg-white p-6 shadow rounded">
          <h2 className="font-bold mb-4">Product Info</h2>
          <pre>{JSON.stringify(passport, null, 2)}</pre>
        </div>
      )}
    </DashboardLayout>
  );
}