import { Link } from "react-router-dom";

export default function DashboardLayout({ title, children }) {
  const role = localStorage.getItem("role");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h2 className="text-xl font-bold mb-8">{role} Panel</h2>

        <nav className="flex flex-col gap-4">
          <Link to={`/${role.toLowerCase()}`} className="hover:text-gray-300">
            Dashboard
          </Link>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-100 p-8">
        <h1 className="text-2xl font-semibold mb-6">{title}</h1>
        {children}
      </div>
    </div>
  );
}