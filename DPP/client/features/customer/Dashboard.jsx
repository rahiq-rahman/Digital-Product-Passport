import { useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getPassport } from "./customer.api";

export default function CustomerDashboard() {
  const [passport, setPassport] = useState(null);
  const [id, setId] = useState("");
  const [error, setError] = useState("");

  const fetchPassport = async () => {
    setError("");
    try {
      const res = await getPassport(id);
      setPassport(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Could not fetch passport");
    }
  };

  return (
    <DashboardLayout title="Digital Product Passport">
      <div className="flex gap-2 mb-6">
        <input className="border p-2 rounded flex-1" placeholder="Enter Product ID"
          value={id}
          onChange={(e) => setId(e.target.value)} />
        <button onClick={fetchPassport}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
          View Passport
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {passport && (
        <div className="space-y-6">

          {/* Product Info */}
          <div className="bg-white p-6 shadow rounded">
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Product Info</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{passport.product?.product_name}</span></div>
              <div><span className="text-gray-500">Serial:</span> <span className="font-medium">{passport.product?.serial_number}</span></div>
              <div><span className="text-gray-500">Model:</span> <span className="font-medium">{passport.product?.model_no}</span></div>
              <div><span className="text-gray-500">Warranty:</span> <span className="font-medium">{passport.product?.warranty} months</span></div>
              <div><span className="text-gray-500">Manufactured:</span> <span className="font-medium">{passport.product?.manufacturing_date?.slice(0, 10)}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium">{passport.product?.current_status}</span></div>
            </div>
          </div>

          {/* Ownership History */}
          <div className="bg-white p-6 shadow rounded">
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Ownership History</h2>
            {passport.ownership?.length === 0 ? (
              <p className="text-gray-500 text-sm">No ownership records.</p>
            ) : (
              passport.ownership?.map((o, i) => (
                <div key={i} className="py-2 border-b last:border-0 text-sm">
                  <span className="font-medium">{o.name}</span>
                  <span className="text-gray-400 ml-2">
                    {o.transfer_date?.slice(0, 10)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Repair History */}
          <div className="bg-white p-6 shadow rounded">
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Repair History</h2>
            {passport.repairs?.length === 0 ? (
              <p className="text-gray-500 text-sm">No repairs recorded.</p>
            ) : (
              passport.repairs?.map((r, i) => (
                <div key={i} className="py-3 border-b last:border-0 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{r.issue}</span>
                    <span className="text-gray-400">{r.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className="text-gray-500 mt-1">
                    Shop: {r.repairshop_name} | Type: {r.repair_type} | Price: {r.repair_price} BDT
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Event Timeline */}
          <div className="bg-white p-6 shadow rounded">
            <h2 className="font-semibold text-lg mb-4 border-b pb-2">Event Timeline</h2>
            {passport.events?.length === 0 ? (
              <p className="text-gray-500 text-sm">No events.</p>
            ) : (
              <div className="space-y-2">
                {passport.events?.map((e, i) => (
                  <div key={i} className="flex gap-4 text-sm">
                    <span className="text-gray-400 w-24 shrink-0">{e.event_date?.slice(0, 10)}</span>
                    <span className="font-medium text-blue-600">{e.event_type}</span>
                    <span className="text-gray-600">{e.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}