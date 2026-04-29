import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute";

import Login    from "../features/auth/Login";
import Register from "../features/auth/Register";

import ManufacturerDashboard from "../features/manufacturer/Dashboard";
import RegisterProduct        from "../features/manufacturer/RegisterProduct";
import DispatchProduct        from "../features/manufacturer/DispatchProduct";
import Products               from "../features/manufacturer/Products";

import ShowroomDashboard from "../features/showroom/Dashboard";

import RepairDashboard from "../features/repair/Dashboard";
import RepairJobs      from "../features/repair/Repairjobs";

import CustomerDashboard from "../features/customer/Dashboard";

const MFR  = (el) => <ProtectedRoute allowedRoles={["MANUFACTURER"]}>{el}</ProtectedRoute>;
const SHW  = (el) => <ProtectedRoute allowedRoles={["SHOWROOM"]}>{el}</ProtectedRoute>;
const REP  = (el) => <ProtectedRoute allowedRoles={["REPAIR"]}>{el}</ProtectedRoute>;
const CUST = (el) => <ProtectedRoute allowedRoles={["CUSTOMER"]}>{el}</ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Manufacturer */}
        <Route path="/manufacturer"               element={MFR(<ManufacturerDashboard />)} />
        <Route path="/manufacturer/products"      element={MFR(<Products />)} />
        <Route path="/manufacturer/register"      element={MFR(<RegisterProduct />)} />
        <Route path="/manufacturer/bulk"          element={MFR(<RegisterProduct />)} />
        <Route path="/manufacturer/dispatch"      element={MFR(<DispatchProduct />)} />
        <Route path="/manufacturer/bulk-dispatch" element={MFR(<DispatchProduct />)} />

        {/* Showroom */}
        <Route path="/showroom" element={SHW(<ShowroomDashboard />)} />

        {/* Repair */}
        <Route path="/repair"      element={REP(<RepairDashboard />)} />
        <Route path="/repair/jobs" element={REP(<RepairJobs />)} />

        {/* Customer */}
        <Route path="/customer" element={CUST(<CustomerDashboard />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;