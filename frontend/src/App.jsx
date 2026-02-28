import { useState } from "react";
import "./App.css";

// ── Check QR (Buyer View) ──────────────────────────────────
function CheckQR() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // { type: 'clean'|'scam'|'unreadable'|'error' }
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);

    const data = new FormData();
    data.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/verify-image", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        // 200 — QR is not in the system, safe to buy
        setResult({ type: "clean" });
      } else if (response.status === 409) {
        // 409 — already registered, seller is reselling
        const json = await response.json();
        setResult({ type: "scam", registeredAt: json.detail?.registered_at });
      } else if (response.status === 400) {
        setResult({ type: "unreadable" });
      } else {
        setResult({ type: "error" });
      }
    } catch {
      setResult({ type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-wrapper">
      <div className="glass-card">
        <div className="title-container">
          <h2>🔍 Check Ticket</h2>
          <p>Upload the QR code before buying to verify it hasn't been sold before</p>
        </div>

        <form onSubmit={handleCheck}>
          <div className="form-group">
            <label>Ticket QR Image</label>
            <div className="file-upload-wrapper">
              <div className="file-upload-btn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <span>Upload QR image to check</span>
              </div>
              <input type="file" className="file-input" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="file-name">{file ? file.name : "No file selected"}</div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading || !file}>
            {loading ? "Checking..." : "Check This QR"}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`check-result check-result--${result.type}`}>
          {result.type === "clean" && (
            <>
              <div className="check-result__icon">✅</div>
              <div className="check-result__title">SAFE TO BUY</div>
              <div className="check-result__subtitle">This QR has not been registered by anyone else. Looks legitimate.</div>
            </>
          )}
          {result.type === "scam" && (
            <>
              <div className="check-result__icon">🚨</div>
              <div className="check-result__title">DO NOT BUY</div>
              <div className="check-result__subtitle">This QR has already been registered.</div>
              <div className="check-result__detail">The seller may be selling this ticket to multiple people.</div>
              {result.registeredAt && (
                <div className="check-result__detail">First registered: {new Date(result.registeredAt).toLocaleString()}</div>
              )}
            </>
          )}
          {result.type === "unreadable" && (
            <>
              <div className="check-result__icon">⚠️</div>
              <div className="check-result__title">QR UNREADABLE</div>
              <div className="check-result__subtitle">Could not decode QR from the image. Try a clearer photo.</div>
            </>
          )}
          {result.type === "error" && (
            <>
              <div className="check-result__icon">🚨</div>
              <div className="check-result__title">CONNECTION ERROR</div>
              <div className="check-result__subtitle">Cannot reach the server. Check your connection.</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Register (Seller View) ────────────────────────────────
function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    if (!file) {
      setStatus({ type: "error", message: "❌ Please select a QR image to upload." });
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/register-image", { method: "POST", body: data });

      if (response.status === 201) {
        setStatus({ type: "success", message: "✅ Ticket QR registered successfully! Buyers can now verify this ticket." });
        setFormData({ name: "", email: "", phone: "" });
        setFile(null);
        e.target.reset();
      } else if (response.status === 409) {
        const errorData = await response.json();
        setStatus({ type: "duplicate", message: `🚫 This QR is already in the system. It was registered at: ${errorData.detail?.registered_at || "unknown"}.` });
      } else {
        setStatus({ type: "error", message: "⚠️ Could not read QR from this image." });
      }
    } catch {
      setStatus({ type: "error", message: "🚨 Cannot connect to backend server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="title-container">
        <h2>Register Ticket</h2>
        <p>List your QR ticket so buyers can verify its authenticity</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input id="name" className="input-field" type="text" name="name" placeholder="e.g. Jane Doe" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input id="email" className="input-field" type="email" name="email" placeholder="jane@example.com" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" className="input-field" type="tel" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>QR Code Image</label>
          <div className="file-upload-wrapper">
            <div className="file-upload-btn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              <span>Click to browse or drag image here</span>
            </div>
            <input type="file" className="file-input" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="file-name">{file ? file.name : "No file selected"}</div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Registering..." : "Register This Ticket"}
        </button>
      </form>

      {status.message && (
        <div className={status.type === "duplicate" ? "message-duplicate" : `message-toast message-${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState("check");

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-logo">Con<span>QR</span></h1>
        <p className="app-tagline">Stop ticket scams before they happen</p>
      </div>

      <div className="tab-switcher">
        <button
          className={`tab-btn ${tab === "check" ? "tab-btn--active" : ""}`}
          onClick={() => setTab("check")}
        >
          🔍 Check Before Buying
        </button>
        <button
          className={`tab-btn ${tab === "register" ? "tab-btn--active" : ""}`}
          onClick={() => setTab("register")}
        >
          📋 Register My Ticket
        </button>
      </div>

      {tab === "check" ? <CheckQR /> : <Register />}
    </div>
  );
}

export default App;