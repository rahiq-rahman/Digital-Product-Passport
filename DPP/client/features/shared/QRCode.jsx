// DPP/client/features/shared/QRCode.jsx
// Generates a QR code SVG/canvas for a product_id using the qrcode library.
// Used inside product tables/modals by any role to share a product passport link.
// Install: npm install qrcode  (in client/)

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";

// ── QRCode canvas component ───────────────────────────────────────────────────
// Renders a QR code that encodes the public passport URL for a product.
export function QRCodeCanvas({ productId, size = 200 }) {
  const canvasRef = useRef(null);
  const url = `${window.location.origin}/p/${productId}`;

  useEffect(() => {
    if (!canvasRef.current || !productId) return;
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width:  size,
      margin: 2,
      color:  { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).catch(console.error);
  }, [productId, size, url]);

  return <canvas ref={canvasRef} style={{ borderRadius: 8, display: "block" }} />;
}

// ── QRModal — full modal with download + share ────────────────────────────────
export function QRModal({ product, onClose }) {
  const [copied, setCopied] = useState(false);
  const canvasRef           = useRef(null);
  const url = `${window.location.origin}/p/${product.product_id}`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width:  220,
      margin: 2,
      color:  { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).catch(console.error);
  }, [product.product_id, url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas with product label below QR
    const out = document.createElement("canvas");
    const pad = 20;
    const labelH = 52;
    out.width  = canvas.width  + pad * 2;
    out.height = canvas.height + pad * 2 + labelH;

    const ctx = out.getContext("2d");
    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    // QR code
    ctx.drawImage(canvas, pad, pad);
    // Product name
    ctx.fillStyle = "#111827";
    ctx.font = "bold 13px 'Instrument Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(product.product_name, out.width / 2, canvas.height + pad + 20);
    // Serial
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px 'DM Mono', monospace";
    ctx.fillText(product.serial_number || "", out.width / 2, canvas.height + pad + 38);

    const link = document.createElement("a");
    link.download = `qr-product-${product.product_id}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select and copy
      const inp = document.createElement("input");
      inp.value = url;
      document.body.appendChild(inp);
      inp.select();
      document.execCommand("copy");
      document.body.removeChild(inp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Product QR Code</div>
            <div className="modal-subtitle">{product.product_name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* QR code */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "inline-block", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <canvas ref={canvasRef} style={{ borderRadius: 6, display: "block" }} />
            </div>
          </div>

          {/* Product info pill */}
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 18, textAlign: "center" }}>
            <div className="fs-13 fw-600 text-1">{product.product_name}</div>
            {product.serial_number && <div className="mono fs-12 text-4 mt-4">{product.serial_number}</div>}
          </div>

          {/* URL row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontSize: 12, color: "var(--text-4)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {url}
            </div>
            <button
              onClick={handleCopy}
              style={{ flexShrink: 0, padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)", background: copied ? "var(--green-bg)" : "var(--bg)", color: copied ? "var(--green)" : "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.14s", whiteSpace: "nowrap" }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>

          {/* Info note */}
          <div style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-border)", borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--blue)", lineHeight: 1.55 }}>
            Anyone who scans this QR code can view the public passport — no login required.
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>Close</button>
            <button className="btn btn-dark" style={{ padding: "10px 20px" }} onClick={handleDownload}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ marginRight: 6 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── QRButton — small button that opens QRModal ────────────────────────────────
export function QRButton({ product, className = "btn btn-sm btn-outline" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className={className} onClick={() => setOpen(true)} title="View QR code">
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><path d="M14 14h.01M14 17h.01M17 14h.01M17 17h3M20 14v.01"/>
        </svg>
        QR
      </button>
      {open && <QRModal product={product} onClose={() => setOpen(false)} />}
    </>
  );
}