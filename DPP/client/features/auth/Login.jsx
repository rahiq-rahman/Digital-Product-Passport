import { useState } from "react";
import { loginUser } from "./auth.api";
import { saveAuth } from "./useAuth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await loginUser({ phone, password });
      saveAuth(res.data);
      console.log("LOGIN RESPONSE:", res.data);

      // redirect by role
    navigate(`/${res.data.user.role.toLowerCase()}`);
  } catch (err) {
    alert("Invalid credentials");
  }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 shadow rounded w-96">
        <h2 className="text-xl font-bold mb-6">Login</h2>

        <input
          className="border p-2 w-full mb-4"
          placeholder="Phone"
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-4"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white w-full p-2 rounded"
        >
          Login
        </button>

        <p className="mt-4 text-sm">
          No account? <Link to="/register" className="text-blue-600">Register</Link>
        </p>
      </div>
    </div>
  );
}