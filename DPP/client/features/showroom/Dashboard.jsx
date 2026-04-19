import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getInventory, transferOwnership } from "./showroom.api";

export default function ShowroomDashboard() {
  const [inventory, setInventory] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getInventory().then((res) => setInventory(res.data));
  }, []);

  const handleTransfer = async () => {
    try {
      await transferOwnership({
        product_id: selectedProduct,
        customer_id: customerId,
      });
      setMessage("Ownership transferred successfully!");
      setCustomerId("");
      setSelectedProduct("");
      getInventory().then((res) => setInventory(res.data));
    } catch (err) {
      setMessage(err.response?.data?.error || "Transfer failed");
    }
  };

  return (
    <DashboardLayout title="Showroom Dashboard">
      {message && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">
          {message}
        </div>
      )}

      {/* Transfer Ownership */}
      <div className="bg-white shadow rounded p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Sell Product to Customer</h2>
        <div className="flex gap-4">
          <select className="border p-2 rounded flex-1"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}>
            <option value="">Select a product</option>
            {inventory.map((item) => (
              <option key={item.product_id} value={item.product_id}>
                {item.product_name} (ID: {item.product_id})
              </option>
            ))}
          </select>
          <input className="border p-2 rounded flex-1" placeholder="Customer User ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)} />
          <button onClick={handleTransfer}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
            Transfer
          </button>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white shadow rounded">
        <h2 className="font-semibold text-lg p-4 border-b">Current Inventory</h2>
        {inventory.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">No products in inventory.</p>
        ) : (
          inventory.map((item) => (
            <div key={item.product_id} className="p-4 border-b flex justify-between items-center">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-gray-500">
                  SN: {item.serial_number} | Model: {item.model_no}
                </p>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                ID: {item.product_id}
              </span>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}