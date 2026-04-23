import { Link, useNavigate, useLocation } from "react-router-dom";
import "../../src/styles/dashboard.css";

const NAV_ICONS = {
  grid: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  box: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
    </svg>
  ),
  plus: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  send: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  layers: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  tool: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  doc: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  home: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  user: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const ROLE_META = {
  MANUFACTURER: {
    color: "#2563eb", colorBg: "#eff6ff", label: "Manufacturer",
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 20h20M4 20V10l6-6 6 6v10M10 20v-6h4v6"/></svg>,
    groups: [
      { label: "Overview", links: [
        { to: "/manufacturer",          label: "Dashboard",        icon: "grid"   },
      ]},
      { label: "Products", links: [
        { to: "/manufacturer/products", label: "All Products",     icon: "box"    },
        { to: "/manufacturer/register", label: "Register Product", icon: "plus"   },
        { to: "/manufacturer/bulk",     label: "Bulk Register",    icon: "layers" },
      ]},
      { label: "Dispatch", links: [
        { to: "/manufacturer/dispatch", label: "Dispatch",         icon: "send"   },
        { to: "/manufacturer/bulk-dispatch", label: "Bulk Dispatch", icon: "layers" },
      ]},
    ],
  },
  SHOWROOM: {
    color: "#d97706", colorBg: "#fffbeb", label: "Showroom",
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    groups: [
      { label: "Overview", links: [
        { to: "/showroom",           label: "Dashboard",  icon: "grid" },
      ]},
      { label: "Inventory", links: [
        { to: "/showroom/inventory", label: "Inventory",  icon: "box"  },
      ]},
    ],
  },
  REPAIR: {
    color: "#dc2626", colorBg: "#fef2f2", label: "Repair Shop",
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    groups: [
      { label: "Overview", links: [
        { to: "/repair",      label: "Dashboard",    icon: "grid" },
      ]},
      { label: "Jobs", links: [
        { to: "/repair/jobs", label: "Repair Jobs",  icon: "tool" },
      ]},
    ],
  },
  CUSTOMER: {
    color: "#059669", colorBg: "#ecfdf5", label: "Customer",
    icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    groups: [
      { label: "My Products", links: [
        { to: "/customer",          label: "My Products",  icon: "box" },
        { to: "/customer/passport", label: "View Passport", icon: "doc" },
      ]},
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
      <aside className="sb">

        {/* Logo */}
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

        {/* Role badge */}
        <div className="sb-role">
          <div className="sb-role-icon" style={{ background: meta.colorBg }}>
            <span style={{ color: meta.color }}>{meta.icon}</span>
          </div>
          <div>
            <div className="sb-role-name">{meta.label}</div>
            <div className="sb-role-sub">Active session</div>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="sb-nav">
          {meta.groups.map(group => (
            <div key={group.label}>
              <div className="sb-nav-lbl">{group.label}</div>
              {group.links.map(link => {
                const active = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to} className={`sb-lnk${active ? " on" : ""}`}>
                    <span style={{ color: active ? meta.color : "var(--text-4)", display: "flex", alignItems: "center" }}>
                      {NAV_ICONS[link.icon]}
                    </span>
                    <span style={{ color: active ? meta.color : undefined }}>{link.label}</span>
                    {active && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
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

      <div className="main">
        <header className="topbar">
          <div className="t-crumb">
            <span className="t-role">{meta.label}</span>
            <span className="t-sep">/</span>
            <span className="t-page">{title}</span>
          </div>
          <div className="t-right">
            <div className="t-pill"><span className="t-dot" />System online</div>
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