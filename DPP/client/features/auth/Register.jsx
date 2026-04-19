import { useState } from "react";
import { registerUser } from "./auth.api";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "CUSTOMER",
  });

  const navigate = useNavigate();

  const handleRegister = async () => {
    await registerUser(form);
    alert("Registered! Please login.");
    navigate("/");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow rounded w-96">
        <h2 className="text-xl font-bold mb-6">Register</h2>

        <input
          placeholder="Name"
          className="border p-2 w-full mb-4"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Phone"
          className="border p-2 w-full mb-4"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-4"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="border p-2 w-full mb-4"
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="CUSTOMER">Customer</option>
          <option value="MANUFACTURER">Manufacturer</option>
          <option value="SHOWROOM">Showroom</option>
          <option value="REPAIR">Repair Shop</option>
        </select>

        <button
          onClick={handleRegister}
          className="bg-green-600 text-white w-full p-2 rounded"
        >
          Register
        </button>

        <p className="mt-4 text-sm">
          Already have account? <Link to="/" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}