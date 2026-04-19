import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { addProduct, getMyProducts } from "./manufacturer.api";

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");

  const loadProducts = async () => {
    const res = await getMyProducts();
    setProducts(res.data);
  };

  const handleAdd = async () => {
    await addProduct({ name });
    setName("");
    loadProducts();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <DashboardLayout title="My Products">
      <div className="flex gap-2 mb-6">
        <input
          className="border p-2 rounded w-64"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white shadow rounded">
        {products.map((p) => (
          <div key={p.product_id} className="p-4 border-b">
            {p.product_name}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}