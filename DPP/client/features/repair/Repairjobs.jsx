import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { getRepairJobs, updateRepairStatus } from "./repair.api";
import { getPassport } from "../customer/customer.api";
import {
  Toast, useToast, Modal, StatCard, FilterToolbar,
  ActiveFilterChips, PassportModal, EmptyState, Spinner, TableFooter,
} from "../shared/components";

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_META = {
  HARDWARE: { color: "var(--blue)",   bg: "var(--blue-bg)",   border: "var(--blue-border)"   },
  SOFTWARE: { color: "var(--purple)", bg: "var(--purple-bg)", border: "var(--purple-border)" },
  COSMETIC: { color: "var(--amber)",  bg: "var(--amber-bg)",  border: "var(--amber-border)"  },
  OTHER:    { color: "var(--text-3)", bg: "var(--bg)",        border: "var(--border)"        },
};

const REPAIR_STATUS_META = {
  IN_PROGRESS: { label: "In Progress", color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)" },
  COMPLETED:   { label: "Completed",   color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)" },
  CANCELLED:   { label: "Cancelled",   color: "var(--text-4)", bg: "var(--bg)",      border: "var(--border)"      },
};

const STATUS_OPTIONS = [
  { value: "",            label: "All statuses"  },
  { value: "IN_PROGRESS", label: "In Progress"   },
  { value: "COMPLETED",   label: "Completed"     },
  { value: "CANCELLED",   label: "Cancelled"     },
];

const TYPE_OPTIONS = [
  { value: "",         label: "All types" },
  { value: "HARDWARE", label: "Hardware"  },
  { value: "SOFTWARE", label: "Software"  },
  { value: "COSMETIC", label: "Cosmetic"  },
  { value: "OTHER",    label: "Other"     },
];

const SORT_OPTIONS = [
  { value: "newest",   label: "Newest first"    },
  { value: "oldest",   label: "Oldest first"    },
  { value: "price_hi", label: "Price high–low"  },
  { value: "price_lo", label: "Price low–high"  },
  { value: "status",   label: "By status"       },
  { value: "type",     label: "By type"         },
];

// ── RepairTypeBadge ───────────────────────────────────────────────────────────
function RepairTypeBadge({ type }) {
  const m = TYPE_META[type] || TYPE_META.OTHER;
  return (
    <span className="badge fs-10" style={{ color: m.color, background: m.bg }}>
      <span className="badge-dot" style={{ background: m.color }} />
      {type}
    </span>
  );
}

// ── RepairStatusBadge ─────────────────────────────────────────────────────────
function RepairStatusBadge({ status }) {
  const m = REPAIR_STATUS_META[status] || REPAIR_STATUS_META.IN_PROGRESS;
  return (
    <span className="badge" style={{ color: m.color, background: m.bg }}>
      <span className="badge-dot" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

// ── UpdateStatusModal ─────────────────────────────────────────────────────────
function UpdateStatusModal({ job, onClose, onUpdated }) {
  const [selected, setSelected] = useState(job.repair_status);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSave = async () => {
    if (selected === job.repair_status) { onClose(); return; }
    setLoading(true); setError("");
    try {
      const res = await updateRepairStatus(job.repair_id, selected);
      onUpdated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status.");
    } finally { setLoading(false); }
  };

  const statusOrder = ["IN_PROGRESS", "COMPLETED", "CANCELLED"];

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Update Repair Status</div>
            <div className="modal-subtitle">{job.product_name || `Product #${job.product_id}`}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Job summary */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div className="grid-2" style={{ gap: "8px 20px" }}>
              <div>
                <div className="fs-11 text-4 mb-4">Product</div>
                <div className="fs-13 fw-500 text-1">{job.product_name || "—"}</div>
              </div>
              <div>
                <div className="fs-11 text-4 mb-4">Serial</div>
                <div className="fs-13 fw-500 text-1 mono">{job.serial_number || "—"}</div>
              </div>
              <div>
                <div className="fs-11 text-4 mb-4">Type</div>
                <RepairTypeBadge type={job.repair_type} />
              </div>
              <div>
                <div className="fs-11 text-4 mb-4">Current status</div>
                <RepairStatusBadge status={job.repair_status} />
              </div>
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <div className="fs-11 text-4 mb-4">Issue</div>
              <div className="fs-13 text-2" style={{ lineHeight: 1.55 }}>{job.issue}</div>
            </div>
          </div>

          {/* Status picker */}
          <div style={{ marginBottom: 20 }}>
            <label className="lbl">New status</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {statusOrder.map(s => {
                const m = REPAIR_STATUS_META[s];
                const isSelected = selected === s;
                const isCurrent  = job.repair_status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setSelected(s)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                      border: `1.5px solid ${isSelected ? m.color : "var(--border)"}`,
                      background: isSelected ? m.bg : "#fafaf8",
                      fontFamily: "var(--font-sans)", transition: "all 0.14s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: isSelected ? m.color : "var(--border)",
                        transition: "background 0.14s",
                      }} />
                      <span className="fs-13 fw-600" style={{ color: isSelected ? m.color : "var(--text-2)" }}>
                        {m.label}
                      </span>
                    </div>
                    {isCurrent && (
                      <span className="fs-11 fw-500" style={{ color: "var(--text-4)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 999, padding: "2px 8px" }}>
                        current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--red)", background: "var(--red-bg)", border: "1px solid var(--red-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-dark"
              style={{ padding: "10px 24px" }}
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving…" : "Save Status"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── JobDetailModal ─────────────────────────────────────────────────────────────
function JobDetailModal({ job, onClose, onStatusUpdate }) {
  const m = TYPE_META[job.repair_type] || TYPE_META.OTHER;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <div className="modal-title">Repair Details</div>
            <div className="modal-subtitle mono fs-12">#{job.repair_id}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Status bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <RepairTypeBadge type={job.repair_type} />
            <RepairStatusBadge status={job.repair_status} />
          </div>

          {/* Product info */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div className="sec-lbl" style={{ marginBottom: 10 }}>Product</div>
            <div className="grid-2" style={{ gap: "8px 20px" }}>
              <div><div className="fs-11 text-4 mb-4">Name</div><div className="fs-13 fw-500 text-1">{job.product_name || "—"}</div></div>
              <div><div className="fs-11 text-4 mb-4">Serial</div><div className="fs-13 fw-500 text-1 mono">{job.serial_number || "—"}</div></div>
              <div><div className="fs-11 text-4 mb-4">Model</div><div className="fs-13 fw-500 text-1 mono">{job.model_no || "—"}</div></div>
              <div><div className="fs-11 text-4 mb-4">Repair ID</div><div className="fs-13 fw-500 text-1 mono">#{job.repair_id}</div></div>
            </div>
          </div>

          {/* Issue */}
          <div style={{ background: "var(--bg)", border: `1px solid ${m.border}`, borderLeft: `3px solid ${m.color}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
            <div className="sec-lbl" style={{ marginBottom: 8 }}>Issue description</div>
            <div className="fs-13 text-2" style={{ lineHeight: 1.65 }}>{job.issue}</div>
          </div>

          {/* Financials */}
          <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
              <div className="fs-11 text-4 mb-6">Price</div>
              <div className="fs-18 fw-700 text-1">{job.repair_price ? `${job.repair_price} BDT` : "—"}</div>
            </div>
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
              <div className="fs-11 text-4 mb-6">Estimated time</div>
              <div className="fs-18 fw-700 text-1">{job.estimated_time || "—"}</div>
            </div>
          </div>

          {/* Owner info */}
          {job.owner_name && (
            <div style={{ background: "var(--green-bg)", border: "1px solid var(--green-border)", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
              <div className="sec-lbl" style={{ marginBottom: 8 }}>Product owner</div>
              <div className="fs-13 fw-600 text-1">{job.owner_name}</div>
              {job.owner_email && <div className="fs-12 text-4 mono mt-4">{job.owner_email}</div>}
            </div>
          )}

          {/* Dates */}
          <div style={{ fontSize: 12, color: "var(--text-4)", marginBottom: 20 }}>
            Logged on {job.repair_date ? new Date(job.repair_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </div>

          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Close</button>
            {job.repair_status === "IN_PROGRESS" && (
              <button
                className="btn btn-dark"
                style={{ padding: "10px 24px" }}
                onClick={() => { onClose(); onStatusUpdate(job); }}
              >
                Update Status
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RepairJobs() {
  const [jobs, setJobs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [passport, setPassport]             = useState(null);
  const [passportLoading, setPassportLoading] = useState(false);
  const [detailJob, setDetailJob]           = useState(null);
  const [statusJob, setStatusJob]           = useState(null);
  const { toast, notify }                   = useToast();

  // Filters
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState("");
  const [typeFilter, setType]       = useState("");
  const [sortBy, setSortBy]         = useState("newest");

  const load = () =>
    getRepairJobs()
      .then(r => setJobs(r.data))
      .catch(() => notify("Failed to load repair jobs.", "error"))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...jobs];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(j =>
        j.issue?.toLowerCase().includes(q) ||
        j.product_name?.toLowerCase().includes(q) ||
        j.serial_number?.toLowerCase().includes(q) ||
        j.model_no?.toLowerCase().includes(q) ||
        j.owner_name?.toLowerCase().includes(q) ||
        String(j.product_id).includes(q) ||
        String(j.repair_id).includes(q)
      );
    }
    if (statusFilter) list = list.filter(j => j.repair_status === statusFilter);
    if (typeFilter)   list = list.filter(j => j.repair_type   === typeFilter);
    switch (sortBy) {
      case "oldest":   list = [...list].reverse(); break;
      case "price_hi": list.sort((a,b) => (Number(b.repair_price)||0) - (Number(a.repair_price)||0)); break;
      case "price_lo": list.sort((a,b) => (Number(a.repair_price)||0) - (Number(b.repair_price)||0)); break;
      case "status":   list.sort((a,b) => a.repair_status.localeCompare(b.repair_status)); break;
      case "type":     list.sort((a,b) => a.repair_type.localeCompare(b.repair_type)); break;
      default: break; // newest = DB order DESC
    }
    return list;
  }, [jobs, search, statusFilter, typeFilter, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total:       jobs.length,
    in_progress: jobs.filter(j => j.repair_status === "IN_PROGRESS").length,
    completed:   jobs.filter(j => j.repair_status === "COMPLETED").length,
    cancelled:   jobs.filter(j => j.repair_status === "CANCELLED").length,
    revenue:     jobs.filter(j => j.repair_status === "COMPLETED").reduce((acc, j) => acc + (Number(j.repair_price) || 0), 0),
  }), [jobs]);

  const isFiltered = !!(search || statusFilter || typeFilter);

  const handleStatusUpdated = (updated) => {
    setJobs(prev => prev.map(j => j.repair_id === updated.repair_id ? { ...j, repair_status: updated.repair_status } : j));
    notify(`Repair #${updated.repair_id} marked as ${REPAIR_STATUS_META[updated.repair_status]?.label}.`);
  };

  const handleViewPassport = async product_id => {
    setPassportLoading(true);
    try { const r = await getPassport(product_id); setPassport(r.data); }
    catch (err) { notify(err.response?.data?.error || "Could not load passport.", "error"); }
    finally { setPassportLoading(false); }
  };

  return (
    <DashboardLayout title="Repair Jobs">
      <Toast toast={toast} />
      <div className="page">
        <div className="mb-28">
          <div className="page-title">Repair Jobs</div>
          <div className="page-sub">All repair records logged by your shop.</div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Total jobs"   value={stats.total}       color="var(--text-1)" pct={100} />
          <StatCard label="In progress"  value={stats.in_progress} color="var(--amber)"  pct={stats.total ? (stats.in_progress/stats.total)*100 : 0} />
          <StatCard label="Completed"    value={stats.completed}   color="var(--green)"  pct={stats.total ? (stats.completed/stats.total)*100 : 0} />
          <StatCard label="Cancelled"    value={stats.cancelled}   color="var(--text-4)" pct={stats.total ? (stats.cancelled/stats.total)*100 : 0} />
          <StatCard label="Revenue (BDT)" value={stats.revenue.toLocaleString()} color="var(--blue)" pct={100} />
        </div>

        {/* Table card */}
        <div className="card" style={{ overflow: "hidden" }}>
          <FilterToolbar
            search={search}
            onSearch={setSearch}
            filters={[
              { value: statusFilter, onChange: setStatus, options: STATUS_OPTIONS, minWidth: 150 },
              { value: typeFilter,   onChange: setType,   options: TYPE_OPTIONS,   minWidth: 140 },
              { value: sortBy,       onChange: setSortBy, options: SORT_OPTIONS,   minWidth: 160 },
            ]}
            resultCount={filtered.length}
            totalCount={jobs.length}
            label="jobs"
            extra={passportLoading && <Spinner size={14} color="var(--red)" />}
          />

          <ActiveFilterChips
            chips={[
              { value: search,       label: `"${search}"`, color: "blue",  onRemove: () => setSearch("") },
              { value: statusFilter, label: STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || "", color: "amber", onRemove: () => setStatus("") },
              { value: typeFilter,   label: TYPE_OPTIONS.find(o => o.value === typeFilter)?.label   || "", color: "blue",  onRemove: () => setType("") },
            ]}
            onClearAll={() => { setSearch(""); setStatus(""); setType(""); }}
          />

          {loading ? (
            <div className="empty">
              <Spinner size={32} color="var(--red)" style={{ margin: "0 auto" }} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              iconColor="var(--red)" iconBg="var(--red-bg)"
              icon={
                <svg width="22" height="22" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
                </svg>
              }
              title={isFiltered ? "No matching jobs" : "No repair jobs yet"}
              subtitle={isFiltered ? "Try adjusting your search or filters." : "Repair records you log will appear here."}
            />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="tbl" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    {["#", "Product", "Issue", "Type", "Price", "Est. Time", "Status", ""].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(j => {
                    const sm = REPAIR_STATUS_META[j.repair_status] || REPAIR_STATUS_META.IN_PROGRESS;
                    return (
                      <tr key={j.repair_id} className="tbl-row" style={{ borderLeft: j.repair_status === "IN_PROGRESS" ? `3px solid ${sm.color}` : "3px solid transparent" }}>
                        {/* ID */}
                        <td>
                          <span className="mono fs-12 text-4">#{j.repair_id}</span>
                        </td>

                        {/* Product */}
                        <td>
                          <div className="fs-13 fw-600 text-1">{j.product_name || `Product #${j.product_id}`}</div>
                          <div className="mono fs-11 text-4 mt-4">{j.serial_number || ""}</div>
                          {j.owner_name && (
                            <div className="fs-11 text-4 mt-4" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                              </svg>
                              {j.owner_name}
                            </div>
                          )}
                        </td>

                        {/* Issue */}
                        <td style={{ maxWidth: 220 }}>
                          <div className="fs-13 text-2" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                            {j.issue}
                          </div>
                          <div className="fs-11 text-4 mono mt-4">
                            {j.repair_date ? new Date(j.repair_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
                          </div>
                        </td>

                        {/* Type */}
                        <td><RepairTypeBadge type={j.repair_type} /></td>

                        {/* Price */}
                        <td>
                          <span className="fs-13 fw-600 text-1">
                            {j.repair_price ? `${Number(j.repair_price).toLocaleString()} BDT` : "—"}
                          </span>
                        </td>

                        {/* Estimated time */}
                        <td>
                          <span className="fs-13 text-3">{j.estimated_time || "—"}</span>
                        </td>

                        {/* Status */}
                        <td><RepairStatusBadge status={j.repair_status} /></td>

                        {/* Actions */}
                        <td>
                          <div className="acts">
                            <button
                              className="btn btn-sm btn-blue"
                              onClick={() => handleViewPassport(j.product_id)}
                              disabled={passportLoading}
                            >
                              Passport
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={() => setDetailJob(j)}
                            >
                              Details
                            </button>
                            {j.repair_status === "IN_PROGRESS" && (
                              <button
                                className="btn btn-sm btn-green"
                                onClick={() => setStatusJob(j)}
                              >
                                Update
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <TableFooter shown={filtered.length} total={jobs.length} label="jobs" filtered={isFiltered} />
        </div>
      </div>

      {/* Modals */}
      {detailJob && (
        <JobDetailModal
          job={detailJob}
          onClose={() => setDetailJob(null)}
          onStatusUpdate={job => { setDetailJob(null); setStatusJob(job); }}
        />
      )}

      {statusJob && (
        <UpdateStatusModal
          job={statusJob}
          onClose={() => setStatusJob(null)}
          onUpdated={handleStatusUpdated}
        />
      )}

      {passport && (
        <PassportModal passport={passport} onClose={() => setPassport(null)} />
      )}
    </DashboardLayout>
  );
}