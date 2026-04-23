import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute";

import Login    from "../features/auth/Login";
import Register from "../features/auth/Register";

import ManufacturerDashboard from "../features/manufacturer/Dashboard";
// import ManufacturerProducts  from "../features/manufacturer/Products";
// import ManufacturerRegister  from "../features/manufacturer/RegisterProduct";
// import ManufacturerBulk      from "../features/manufacturer/BulkRegister";
// import ManufacturerDispatch  from "../features/manufacturer/Dispatch";
// import ManufacturerBulkDispatch from "../features/manufacturer/BulkDispatch";

import ShowroomDashboard  from "../features/showroom/Dashboard";
// import ShowroomInventory  from "../features/showroom/Inventory";

import RepairDashboard from "../features/repair/Dashboard";
// import RepairJobs      from "../features/repair/Jobs";

import CustomerDashboard from "../features/customer/Dashboard";
// import CustomerPassport  from "../features/customer/PassportSearch";

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

        <Route path="/manufacturer"              element={MFR(<ManufacturerDashboard />)} />
        {/* <Route path="/manufacturer/products"     element={MFR(<ManufacturerProducts />)} />
        <Route path="/manufacturer/register"     element={MFR(<ManufacturerRegister />)} />
        <Route path="/manufacturer/bulk"         element={MFR(<ManufacturerBulk />)} />
        <Route path="/manufacturer/dispatch"     element={MFR(<ManufacturerDispatch />)} />
        <Route path="/manufacturer/bulk-dispatch" element={MFR(<ManufacturerBulkDispatch />)} /> */}

        <Route path="/showroom"           element={SHW(<ShowroomDashboard />)} />
        {/* <Route path="/showroom/inventory" element={SHW(<ShowroomInventory />)} /> */}

        <Route path="/repair"       element={REP(<RepairDashboard />)} />
        {/* <Route path="/repair/jobs"  element={REP(<RepairJobs />)} /> */}

        <Route path="/customer"          element={CUST(<CustomerDashboard />)} />
        {/* <Route path="/customer/passport" element={CUST(<CustomerPassport />)} /> */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;