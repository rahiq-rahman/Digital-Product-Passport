import { useState, useMemo } from "react";

// ── SearchBar component ──────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
      <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="14" height="14" fill="none" stroke="var(--text-4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        className="inp"
        style={{ paddingLeft: 36 }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

// ── FilterSelect component ───────────────────────────────────────
export function FilterSelect({ value, onChange, options, placeholder = "All" }) {
  return (
    <select
      className="inp"
      style={{ width: "auto", minWidth: 140 }}
      value={value}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  );
}

// ── useProductFilter hook ────────────────────────────────────────
export function useProductFilter(products) {
  const [search,    setSearch]    = useState("");
  const [statusFilter, setStatus] = useState("");

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.product_name?.toLowerCase().includes(q) ||
        p.serial_number?.toLowerCase().includes(q) ||
        p.model_no?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);

      const matchStatus =
        !statusFilter ||
        p.current_status === statusFilter ||
        p.inventory_status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  return { search, setSearch, statusFilter, setStatus, filtered };
}

// ── STATUS options for filter dropdowns ─────────────────────────
export const PRODUCT_STATUSES = [
  { value: "CREATED",     label: "Created"    },
  { value: "IN_SHOWROOM", label: "In Showroom"},
  { value: "SOLD",        label: "Sold"       },
  { value: "IN_REPAIR",   label: "In Repair"  },
];

export const INVENTORY_STATUSES = [
  { value: "IN_SHOWROOM", label: "In Showroom" },
  { value: "SOLD",        label: "Sold"        },
];