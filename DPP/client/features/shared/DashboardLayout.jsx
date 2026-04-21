import { Link, useNavigate, useLocation } from "react-router-dom";

const ROLE_META = {
  MANUFACTURER: {
    color:   "#2563eb",
    colorBg: "#eff6ff",
    label:   "Manufacturer",
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
    color:   "#d97706",
    colorBg: "#fffbeb",
    label:   "Showroom",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    links: [
      { to: "/showroom", label: "Dashboard", icon: (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      )},
    ],
  },
  REPAIR: {
    color:   "#dc2626",
    colorBg: "#fef2f2",
    label:   "Repair Shop",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    links: [
      { to: "/repair", label: "Dashboard", icon: (
        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      )},
    ],
  },
  CUSTOMER: {
    color:   "#059669",
    colorBg: "#ecfdf5",
    label:   "Customer",
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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }

  .shell {
    display: flex;
    height: 100vh;
    background: #f5f4f0;
    font-family: 'Instrument Sans', sans-serif;
    overflow: hidden;
  }

  .sb {
    width: 228px;
    flex-shrink: 0;
    background: #ffffff;
    border-right: 1px solid #ebe9e2;
    display: flex;
    flex-direction: column;
  }

  .sb-logo {
    padding: 22px 20px 18px;
    border-bottom: 1px solid #ebe9e2;
    display: flex;
    align-items: center;
    gap: 11px;
  }
  .sb-logo-mark {
    width: 34px; height: 34px; border-radius: 9px;
    background: #111827;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sb-logo-name { font-size: 14px; font-weight: 600; color: #111827; letter-spacing: -0.01em; }
  .sb-logo-sub  { font-size: 10px; color: #9ca3af; margin-top: 2px; }

  .sb-role {
    margin: 14px 14px 4px;
    padding: 11px 13px;
    border-radius: 10px;
    background: #fafaf8;
    border: 1px solid #ebe9e2;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sb-role-icon {
    width: 30px; height: 30px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sb-role-name { font-size: 12px; font-weight: 600; color: #111827; }
  .sb-role-sub  { font-size: 10px; color: #9ca3af; margin-top: 1px; }

  .sb-nav { flex: 1; padding: 8px 12px; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
  .sb-nav-lbl {
    font-size: 10px; font-weight: 600; color: #9ca3af;
    letter-spacing: 0.09em; text-transform: uppercase;
    padding: 10px 8px 5px;
  }
  .sb-lnk {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 10px; border-radius: 8px;
    font-size: 13px; font-weight: 500; color: #6b7280;
    text-decoration: none;
    transition: background 0.12s, color 0.12s;
    position: relative;
  }
  .sb-lnk:hover { background: #f5f4f0; color: #111827; }
  .sb-lnk.on    { background: #f0efe9; color: #111827; font-weight: 600; }

  .sb-footer { padding: 12px; border-top: 1px solid #ebe9e2; }
  .sb-user {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 9px; margin-bottom: 6px;
  }
  .sb-av {
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
  }
  .sb-uname { font-size: 13px; font-weight: 600; color: #111827; }
  .sb-urole { font-size: 11px; color: #9ca3af; margin-top: 1px; }
  .sb-out {
    width: 100%; padding: 9px 12px; border-radius: 8px;
    border: 1px solid #ebe9e2; background: transparent;
    color: #6b7280; font-size: 12px; font-weight: 500;
    cursor: pointer; font-family: 'Instrument Sans', sans-serif;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.14s;
  }
  .sb-out:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .topbar {
    height: 56px; flex-shrink: 0;
    background: #ffffff;
    border-bottom: 1px solid #ebe9e2;
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 28px;
  }
  .t-crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .t-role { color: #9ca3af; font-weight: 400; }
  .t-sep  { color: #d1d5db; font-weight: 300; }
  .t-page { color: #111827; font-weight: 600; }

  .t-right { display: flex; align-items: center; gap: 12px; }
  .t-pill {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 500; color: #6b7280;
    background: #f5f4f0; border: 1px solid #ebe9e2;
    padding: 4px 11px; border-radius: 999px;
  }
  .t-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #10b981;
    animation: glow 2.5s ease infinite;
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
    50%      { box-shadow: 0 0 0 4px rgba(16,185,129,0.0); }
  }
  .t-div { width: 1px; height: 18px; background: #ebe9e2; }
  .t-user { display: flex; align-items: center; gap: 9px; }
  .t-av {
    width: 30px; height: 30px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .t-name { font-size: 13px; font-weight: 600; color: #111827; }
  .t-role2 { font-size: 11px; color: #9ca3af; margin-top: 1px; }

  .content {
    flex: 1; overflow-y: auto; background: #f5f4f0;
  }
  .content::-webkit-scrollbar { width: 5px; }
  .content::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
  .content::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
`;

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
    <>
      <style>{css}</style>
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
                  <span style={{ color: active ? meta.color : "#9ca3af", display: "flex", alignItems: "center" }}>
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
    </>
  );
}