// DPP/client/features/public/QRScanner.jsx
// Standalone QR scanner page — no login required.
// Route: /scan
// Uses the browser's camera via jsQR (loaded from CDN via script tag fallback)
// or the html5-qrcode library approach using a simple video + canvas decode loop.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0a0a0a; font-family: 'Instrument Sans', sans-serif; height: 100%; }

  .qs-shell {
    min-height: 100vh;
    background: #0a0a0a;
    display: flex; flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  /* Top bar */
  .qs-bar {
    width: 100%; padding: 16px 20px;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 10;
  }
  .qs-back {
    display: flex; align-items: center; gap: 8px;
    color: #fff; font-size: 14px; font-weight: 600;
    background: rgba(255,255,255,0.1); border: none; cursor: pointer;
    padding: 8px 14px; border-radius: 9px; font-family: 'Instrument Sans', sans-serif;
    transition: background 0.14s;
  }
  .qs-back:hover { background: rgba(255,255,255,0.18); }
  .qs-title { font-size: 15px; font-weight: 700; color: #fff; }
  .qs-spacer { width: 80px; }

  /* Camera area */
  .qs-camera-wrap {
    flex: 1; width: 100%; display: flex; align-items: center; justify-content: center;
    position: relative; max-height: calc(100vh - 200px);
  }
  .qs-video {
    width: 100%; height: 100%; object-fit: cover;
    position: absolute; inset: 0;
  }
  .qs-canvas { display: none; }

  /* Viewfinder overlay */
  .qs-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .qs-finder {
    width: min(72vw, 280px); height: min(72vw, 280px);
    position: relative;
  }
  /* Corner brackets */
  .qs-finder::before, .qs-finder::after,
  .qs-corner-br, .qs-corner-bl {
    content: '';
    position: absolute;
    width: 36px; height: 36px;
    border-color: #fff;
    border-style: solid;
  }
  .qs-finder::before { top: 0; left: 0; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
  .qs-finder::after  { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
  .qs-corner-br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
  .qs-corner-bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }

  /* Scan line animation */
  .qs-scan-line {
    position: absolute; left: 4px; right: 4px; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
    border-radius: 1px;
    animation: qs-scan 2s ease-in-out infinite;
  }
  @keyframes qs-scan {
    0%   { top: 8px;  opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: calc(100% - 10px); opacity: 0; }
  }

  /* Dark vignette around finder */
  .qs-vignette {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse min(72vw, 280px) min(72vw, 280px) at center, transparent 95%, rgba(0,0,0,0.7) 100%);
  }

  /* Bottom panel */
  .qs-bottom {
    width: 100%; padding: 20px;
    background: linear-gradient(to top, #0a0a0a, rgba(10,10,10,0.95));
    position: relative; z-index: 10;
  }
  .qs-hint {
    text-align: center; font-size: 13px; color: rgba(255,255,255,0.55);
    margin-bottom: 16px; line-height: 1.5;
  }

  /* Manual entry */
  .qs-manual {
    display: flex; gap: 8px; max-width: 400px; margin: 0 auto;
  }
  .qs-inp {
    flex: 1; padding: 11px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08);
    color: #fff; font-size: 14px; font-family: 'Instrument Sans', sans-serif;
    outline: none; transition: border-color 0.14s;
    font-variant-numeric: tabular-nums;
  }
  .qs-inp::placeholder { color: rgba(255,255,255,0.3); }
  .qs-inp:focus { border-color: rgba(255,255,255,0.4); }
  .qs-go {
    padding: 11px 20px; border-radius: 10px; border: none;
    background: #fff; color: #111827; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.14s; white-space: nowrap;
  }
  .qs-go:hover { background: #f0efe9; }
  .qs-go:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Status messages */
  .qs-status {
    text-align: center; margin-top: 12px;
    font-size: 13px; font-weight: 500;
  }
  .qs-status.scanning  { color: rgba(255,255,255,0.5); }
  .qs-status.found     { color: #34d399; }
  .qs-status.error     { color: #f87171; }
  .qs-status.no-camera { color: #fbbf24; }

  /* Permission denied screen */
  .qs-denied {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 14px;
    padding: 32px; text-align: center;
  }
  .qs-denied-icon {
    width: 56px; height: 56px; border-radius: 14px; background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center;
  }
  .qs-denied-title { font-size: 17px; font-weight: 700; color: #fff; }
  .qs-denied-sub   { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.55; max-width: 280px; }

  @keyframes qs-spin { to { transform: rotate(360deg); } }
`;

// Load jsQR from CDN dynamically
function loadJsQR() {
  return new Promise((resolve, reject) => {
    if (window.jsQR) { resolve(window.jsQR); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
    s.onload  = () => resolve(window.jsQR);
    s.onerror = () => reject(new Error("Failed to load jsQR"));
    document.head.appendChild(s);
  });
}

export default function QRScanner() {
  const navigate = useNavigate();
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const jsQRRef   = useRef(null);

  const [status, setStatus]     = useState("starting"); // starting | scanning | found | error | denied | no-camera
  const [manualId, setManualId] = useState("");
  const [found, setFound]       = useState(false); // prevent double-navigation

  // Start camera
  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        jsQRRef.current = await loadJsQR();
      } catch {
        // jsQR load failure — manual entry still works
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStatus("scanning");
          tick();
        }
      } catch (err) {
        if (!active) return;
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setStatus("denied");
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          setStatus("no-camera");
        } else {
          setStatus("error");
        }
      }
    };

    const tick = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !jsQRRef.current) { rafRef.current = requestAnimationFrame(tick); return; }
      if (video.readyState !== video.HAVE_ENOUGH_DATA) { rafRef.current = requestAnimationFrame(tick); return; }

      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQRRef.current(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

      if (code?.data) {
        handleQRData(code.data);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    start();
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleQRData = (raw) => {
    if (found) return;
    // The QR encodes either a URL like /p/42 or just the product_id "42"
    let productId = raw.trim();
    // If it looks like a URL, extract the last path segment
    try {
      const url = new URL(productId);
      const parts = url.pathname.split("/").filter(Boolean);
      productId = parts[parts.length - 1];
    } catch {
      // Not a URL — use as-is, strip any leading /p/
      productId = productId.replace(/^\/p\//, "").trim();
    }

    if (!productId || isNaN(Number(productId))) return; // not a valid product ID

    setFound(true);
    setStatus("found");
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setTimeout(() => navigate(`/p/${productId}`), 600);
  };

  const handleManualGo = () => {
    const id = manualId.trim();
    if (!id || isNaN(Number(id))) return;
    streamRef.current?.getTracks().forEach(t => t.stop());
    navigate(`/p/${id}`);
  };

  const statusMsg = {
    starting:  "Starting camera…",
    scanning:  "Point camera at a product QR code",
    found:     "QR code detected — opening passport…",
    error:     "Camera error. Use manual entry below.",
    denied:    "",
    "no-camera": "",
  };

  const showCamera = !["denied", "no-camera"].includes(status);

  return (
    <>
      <style>{css}</style>
      <div className="qs-shell">
        {/* Top bar */}
        <div className="qs-bar">
          <button className="qs-back" onClick={() => navigate(-1)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <div className="qs-title">Scan QR</div>
          <div className="qs-spacer" />
        </div>

        {/* Camera / permission denied */}
        {showCamera ? (
          <div className="qs-camera-wrap">
            <video ref={videoRef} className="qs-video" muted playsInline />
            <canvas ref={canvasRef} className="qs-canvas" />
            <div className="qs-vignette" />
            <div className="qs-overlay">
              <div className="qs-finder">
                <div className="qs-corner-br" />
                <div className="qs-corner-bl" />
                {status === "scanning" && <div className="qs-scan-line" />}
              </div>
            </div>
          </div>
        ) : (
          <div className="qs-denied">
            <div className="qs-denied-icon">
              <svg width="26" height="26" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <div className="qs-denied-title">
              {status === "denied" ? "Camera access denied" : "No camera found"}
            </div>
            <div className="qs-denied-sub">
              {status === "denied"
                ? "Allow camera access in your browser settings, then reload the page."
                : "Your device doesn't have a camera. Use the manual entry below."}
            </div>
          </div>
        )}

        {/* Bottom panel */}
        <div className="qs-bottom">
          {statusMsg[status] && (
            <div className={`qs-status ${status}`}>
              {status === "found" && "✓ "}{statusMsg[status]}
            </div>
          )}

          <div className="qs-hint" style={{ marginTop: statusMsg[status] ? 12 : 0 }}>
            Or enter a product ID manually
          </div>
          <div className="qs-manual">
            <input
              className="qs-inp"
              type="number"
              placeholder="Product ID e.g. 42"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualGo()}
              min="1"
            />
            <button className="qs-go" onClick={handleManualGo} disabled={!manualId.trim() || isNaN(Number(manualId))}>
              View →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}