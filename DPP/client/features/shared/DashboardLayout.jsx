import { Link, useNavigate, useLocation } from "react-router-dom";
import "../../src/styles/dashboard.css";

const ROLE_META = {
  MANUFACTURER: {
    color: "#2563eb", colorBg: "#eff6ff", label: "Manufacturer",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M2 20h20M4 20V10l6-6 6 6v10M10 20v-6h4v6"/>
      </svg>
    ),
    links: [
      { to: "/manufacturer", label: "Dashboard", icon: (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      )},
    ],
  },
  SHOWROOM: {
    color: "#d97706", colorBg: "#fffbeb", label: "Showroom",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    links: [
      { to: "/showroom", label: "Inventory", icon: (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
        </svg>
      )},
    ],
  },
  REPAIR: {
    color: "#dc2626", colorBg: "#fef2f2", label: "Repair Shop",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    links: [
      { to: "/repair", label: "Repair Jobs", icon: (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
      )},
    ],
  },
  CUSTOMER: {
    color: "#059669", colorBg: "#ecfdf5", label: "Customer",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    links: [
      { to: "/customer", label: "My Passport", icon: (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      )},
    ],
  },
};

export default function DashboardLayout({ title, children }) {
  const role     = localStorage.getItem("role") || "MANUFACTURER";
  const name     = localStorage.getItem("name") || "User";
  const navigate = useNavigate();
  const location = useLocation();

  const meta     = ROLE_META[role] || ROLE_META.MANUFACTURER;
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/");
  };

  return (
    <div className="shell">

      {/* ── Sidebar ── */}
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-logo-mark">
            <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="sb-logo-name">DPP System</div>
            <div className="sb-logo-sub">Digital Product Passport</div>
          </div>
        </div>

        <div className="sb-role">
          <div className="sb-role-icon" style={{ background: meta.colorBg }}>
            <span style={{ color: meta.color }}>{meta.icon}</span>
          </div>
          <div>
            <div className="sb-role-name">{meta.label}</div>
            <div className="sb-role-sub">Active session</div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-nav-lbl">Menu</div>
          {meta.links.map(link => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to} className={`sb-lnk${active ? " on" : ""}`}>
                <span style={{ color: active ? meta.color : "var(--text-4)", display: "flex", alignItems: "center" }}>
                  {link.icon}
                </span>
                <span style={{ color: active ? meta.color : undefined }}>{link.label}</span>
                {active && (
                  <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-av" style={{ background: meta.color }}>{initials}</div>
            <div>
              <div className="sb-uname">{name}</div>
              <div className="sb-urole">{role}</div>
            </div>
          </div>
          <button className="sb-out" onClick={handleLogout}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        <header className="topbar">
          <div className="t-crumb">
            <span className="t-role">{meta.label}</span>
            <span className="t-sep">/</span>
            <span className="t-page">{title}</span>
          </div>
          <div className="t-right">
            <div className="t-pill">
              <span className="t-dot" />
              System online
            </div>
            <div className="t-div" />
            <div className="t-user">
              <div className="t-av" style={{ background: meta.color }}>{initials}</div>
              <div>
                <div className="t-name">{name}</div>
                <div className="t-role2">{role}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}