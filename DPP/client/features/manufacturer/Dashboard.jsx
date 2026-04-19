import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addProduct, getMyProducts, sendToShowroom } from "./manufacturer.api";

const emptyForm = {
  serial_number: "",
  model_no: "",
  product_name: "",
  manufacturing_date: "",
  warranty: "",
};

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showroomId, setShowroomId] = useState("");
  const [assignProductId, setAssignProductId] = useState("");
  const [message, setMessage] = useState("");

  const loadProducts = async () => {
    const res = await getMyProducts();
    setProducts(res.data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAdd = async () => {
    try {
      await addProduct(form);
      setForm(emptyForm);
      setMessage("Product created!");
      loadProducts();
    } catch (err) {
      setMessage(err.response?.data?.error || "Error creating product");
    }
  };

  const handleSendToShowroom = async () => {
    try {
      await sendToShowroom({
        product_id: assignProductId,
        showroom_id: showroomId,
      });
      setMessage("Product sent to showroom!");
      setAssignProductId("");
      setShowroomId("");
    } catch (err) {
      setMessage(err.response?.data?.error || "Error sending to showroom");
    }
  };

  return (
    <DashboardLayout title="Manufacturer Dashboard">
      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
          {message}
        </div>
      )}

      {/* Add Product */}
      <div className="bg-white shadow rounded p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Add New Product</h2>
        <div className="grid grid-cols-2 gap-4">
          <input className="border p-2 rounded" placeholder="Product Name"
            value={form.product_name}
            onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Serial Number"
            value={form.serial_number}
            onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Model No"
            value={form.model_no}
            onChange={(e) => setForm({ ...form, model_no: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Warranty (months)"
            value={form.warranty}
            onChange={(e) => setForm({ ...form, warranty: e.target.value })} />
          <input className="border p-2 rounded col-span-2" type="date"
            placeholder="Manufacturing Date"
            value={form.manufacturing_date}
            onChange={(e) => setForm({ ...form, manufacturing_date: e.target.value })} />
        </div>
        <button onClick={handleAdd}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Create Product
        </button>
      </div>

      {/* Send to Showroom */}
      <div className="bg-white shadow rounded p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Send Product to Showroom</h2>
        <div className="flex gap-4">
          <input className="border p-2 rounded flex-1" placeholder="Product ID"
            value={assignProductId}
            onChange={(e) => setAssignProductId(e.target.value)} />
          <input className="border p-2 rounded flex-1" placeholder="Showroom User ID"
            value={showroomId}
            onChange={(e) => setShowroomId(e.target.value)} />
          <button onClick={handleSendToShowroom}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Send
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white shadow rounded">
        <h2 className="font-semibold text-lg p-4 border-b">My Products</h2>
        {products.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">No products yet.</p>
        ) : (
          products.map((p) => (
            <div key={p.product_id} className="p-4 border-b flex justify-between items-center">
              <div>
                <p className="font-medium">{p.product_name}</p>
                <p className="text-sm text-gray-500">
                  SN: {p.serial_number} | Model: {p.model_no}
                </p>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                ID: {p.product_id}
              </span>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}