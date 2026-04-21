import { Link, useNavigate, useLocation } from "react-router-dom";

const G = {
  bg:      "#0f1117",
  surface: "#161b27",
  card:    "#1c2333",
  border:  "#2a3347",
  accent:  "#3b7eff",
  accentHi:"#6fa3ff",
  text:    "#e8edf5",
  muted:   "#8892a4",
  danger:  "#f87171",
  success: "#34d399",
  warn:    "#fbbf24",
};

const ROLE_META = {
  MANUFACTURER: {
    color:  G.accent,
    label:  "Manufacturer",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M2 20h20M4 20V10l6-6 6 6v10M10 20v-6h4v6"/>
      </svg>
    ),
    links: [
      { to: "/manufacturer", label: "Dashboard", icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      )},
    ],
  },
  SHOWROOM: {
    color:  G.warn,
    label:  "Showroom",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    links: [
      { to: "/showroom", label: "Dashboard", icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      )},
    ],
  },
  REPAIR: {
    color:  G.danger,
    label:  "Repair Shop",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    links: [
      { to: "/repair", label: "Dashboard", icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
      )},
    ],
  },
  CUSTOMER: {
    color:  G.success,
    label:  "Customer",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    links: [
      { to: "/customer", label: "My Passport", icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      )},
    ],
  },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; }

  .layout-shell {
    display: flex;
    height: 100vh;
    background: ${G.bg};
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 240px;
    flex-shrink: 0;
    background: ${G.surface};
    border-right: 1px solid ${G.border};
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
  }

  .sidebar-logo {
    padding: 24px 22px 20px;
    border-bottom: 1px solid ${G.border};
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .logo-mark {
    width: 36px; height: 36px; border-radius: 10px;
    background: ${G.accent};
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .logo-text-main {
    font-size: 15px; font-weight: 700; color: ${G.text}; letter-spacing: -0.02em;
  }
  .logo-text-sub {
    font-size: 10px; color: ${G.muted}; margin-top: 1px; letter-spacing: 0.03em;
  }

  .role-badge {
    margin: 16px 14px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid ${G.border};
    background: ${G.card};
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .role-icon {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .role-name { font-size: 12px; font-weight: 600; color: ${G.text}; }
  .role-sub  { font-size: 10px; color: ${G.muted}; margin-top: 2px; }

  .nav-section {
    flex: 1;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
  .nav-label {
    font-size: 10px; font-weight: 600; color: ${G.muted};
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 10px 10px 6px;
  }
  .nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    font-size: 13px; font-weight: 500;
    color: ${G.muted};
    text-decoration: none;
    transition: background 0.14s, color 0.14s;
    position: relative;
  }
  .nav-link:hover { background: rgba(255,255,255,0.04); color: ${G.text}; }
  .nav-link.active {
    background: rgba(59,126,255,0.12);
    color: ${G.accentHi};
  }
  .nav-link.active::before {
    content: '';
    position: absolute;
    left: 0; top: 6px; bottom: 6px;
    width: 3px; border-radius: 0 2px 2px 0;
    background: ${G.accent};
  }

  .sidebar-footer {
    padding: 14px;
    border-top: 1px solid ${G.border};
  }
  .user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    margin-bottom: 8px;
  }
  .avatar {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .user-name { font-size: 13px; font-weight: 600; color: ${G.text}; }
  .user-role { font-size: 11px; color: ${G.muted}; margin-top: 1px; }

  .logout-btn {
    width: 100%; padding: 10px 14px; border-radius: 10px;
    border: 1px solid ${G.border}; background: transparent;
    color: ${G.muted}; font-size: 13px; font-weight: 500;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; gap: 8px;
    transition: background 0.14s, color 0.14s, border-color 0.14s;
  }
  .logout-btn:hover {
    background: rgba(248,113,113,0.08);
    border-color: rgba(248,113,113,0.3);
    color: ${G.danger};
  }

  /* ── Main area ── */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: ${G.bg};
  }

  .topbar {
    height: 62px;
    flex-shrink: 0;
    background: ${G.surface};
    border-bottom: 1px solid ${G.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
  }
  .topbar-left {
    display: flex; align-items: center; gap: 10px;
  }
  .topbar-breadcrumb {
    font-size: 12px; color: ${G.muted};
  }
  .topbar-slash { color: ${G.border}; margin: 0 6px; }
  .topbar-title {
    font-size: 14px; font-weight: 600; color: ${G.text};
  }
  .topbar-right {
    display: flex; align-items: center; gap: 16px;
  }
  .status-dot {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: ${G.muted};
  }
  .status-dot::before {
    content: '';
    width: 7px; height: 7px; border-radius: 50%;
    background: ${G.success};
    box-shadow: 0 0 0 2px rgba(52,211,153,0.2);
    animation: pulse 2.4s ease infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
    50%       { box-shadow: 0 0 0 5px rgba(52,211,153,0.05); }
  }

  .content-area {
    flex: 1;
    overflow-y: auto;
  }
  .content-area::-webkit-scrollbar { width: 5px; }
  .content-area::-webkit-scrollbar-track { background: transparent; }
  .content-area::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 3px; }
`;

export default function DashboardLayout({ title, children }) {
  const role     = localStorage.getItem("role") || "MANUFACTURER";
  const name     = localStorage.getItem("name") || "User";
  const navigate = useNavigate();
  const location = useLocation();

  const meta  = ROLE_META[role] || ROLE_META.MANUFACTURER;
  const color = meta.color;

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/");
  };

  return (
    <>
      <style>{css}</style>
      <div className="layout-shell">

        {/* ── Sidebar ── */}
        <aside className="sidebar">

          {/* Logo */}
          <div className="sidebar-logo">
            <div className="logo-mark">
              <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div className="logo-text-main">DPP System</div>
              <div className="logo-text-sub">Digital Product Passport</div>
            </div>
          </div>

          {/* Role badge */}
          <div className="role-badge">
            <div className="role-icon" style={{ background: `${color}18` }}>
              <span style={{ color }}>{meta.icon}</span>
            </div>
            <div>
              <div className="role-name">{meta.label}</div>
              <div className="role-sub">Active session</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="nav-section">
            <div className="nav-label">Navigation</div>
            {meta.links.map(link => {
              const active = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to} className={`nav-link${active ? " active" : ""}`}>
                  <span style={{ color: active ? color : G.muted, display: "flex", alignItems: "center" }}>
                    {link.icon}
                  </span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="user-row">
              <div className="avatar" style={{ background: color }}>
                {initials}
              </div>
              <div>
                <div className="user-name">{name}</div>
                <div className="user-role">{role}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="main-area">

          {/* Topbar */}
          <header className="topbar">
            <div className="topbar-left">
              <span className="topbar-breadcrumb">{meta.label}</span>
              <span className="topbar-slash">/</span>
              <span className="topbar-title">{title}</span>
            </div>
            <div className="topbar-right">
              <span className="status-dot">System online</span>
              <div style={{ width: 1, height: 20, background: G.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff",
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: G.text }}>{name}</div>
                  <div style={{ fontSize: 11, color: G.muted }}>{role}</div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="content-area">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}