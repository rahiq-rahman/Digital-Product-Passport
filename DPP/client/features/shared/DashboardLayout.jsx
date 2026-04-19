import { Link, useNavigate } from "react-router-dom";

export default function DashboardLayout({ title, children }) {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const navLinks = {
    MANUFACTURER: [
      { label: "Dashboard", to: "/manufacturer" },
    ],
    SHOWROOM: [
      { label: "Dashboard", to: "/showroom" },
    ],
    REPAIR: [
      { label: "Dashboard", to: "/repair" },
    ],
    CUSTOMER: [
      { label: "My Passport", to: "/customer" },
    ],
  };

  const links = navLinks[role] || [];

  const roleColors = {
    MANUFACTURER: "bg-blue-700",
    SHOWROOM: "bg-purple-700",
    REPAIR: "bg-green-700",
    CUSTOMER: "bg-orange-600",
  };

  const sidebarColor = roleColors[role] || "bg-gray-900";

  return (
    <div className="min-h-screen flex">

      {/* Sidebar */}
      <div className={`w-64 ${sidebarColor} text-white flex flex-col`}>

        {/* Logo / App name */}
        <div className="p-6 border-b border-white/10">
          <h1 className="text-lg font-bold tracking-wide">DPP System</h1>
          <p className="text-xs text-white/60 mt-1">Digital Product Passport</p>
        </div>

        {/* Role badge */}
        <div className="px-6 py-4 border-b border-white/10">
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
            {role}
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 transition-colors text-left"
          >
            Sign Out
          </button>
        </div>

      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-100">

        {/* Top navbar */}
        <div className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {localStorage.getItem("name") || "User"}
              </p>
              <p className="text-xs text-gray-400">{role}</p>
            </div>
            <div className={`w-9 h-9 rounded-full ${sidebarColor} text-white flex items-center justify-center text-sm font-bold`}>
              {(localStorage.getItem("name") || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}