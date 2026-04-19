import { useEffect, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getInventory } from "./showroom.api";

export default function ShowroomDashboard() {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    getInventory().then((res) => setInventory(res.data));
  }, []);

  return (
    <DashboardLayout title="Showroom Inventory">
      <div className="bg-white shadow rounded">
        {inventory.map((item) => (
          <div key={item.product_id} className="p-4 border-b">
            {item.product_name}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}