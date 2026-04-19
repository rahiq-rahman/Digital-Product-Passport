import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import ManufacturerDashboard from "./features/manufacturer/Dashboard";
import ShowroomDashboard from "./features/showroom/Dashboard";
import RepairDashboard from "./features/repair/Dashboard";
import CustomerDashboard from "./features/customer/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/manufacturer"
          element={
            <ProtectedRoute allowedRoles={["MANUFACTURER"]}>
              <ManufacturerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/showroom"
          element={
            <ProtectedRoute allowedRoles={["SHOWROOM"]}>
              <ShowroomDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/repair"
          element={
            <ProtectedRoute allowedRoles={["REPAIR"]}>
              <RepairDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;