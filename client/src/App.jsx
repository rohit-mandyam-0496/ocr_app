import React, { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function App() {
  const [file, setFile] = useState();
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  
  async function scan(event) {
    event.preventDefault();
    if (!file || !consent)
      return setMessage("Select an image and provide consent.");
    setBusy(true);
    setMessage("Reading document…");
    setResult(undefined);
    const form = new FormData();
    form.append("document", file);
    form.append("consent", "true");
    try {
      const response = await fetch(`${API_URL}/verifications/scan`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResult({ id: data.verificationId, ...data.result });
      setMessage("Please verify the extracted values.");
    } catch (error) {
      setMessage(error.message || "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    const response = await fetch(
      `${API_URL}/verifications/${result.id}/confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          dateOfBirth: result.dateOfBirth,
        }),
      },
    );
    setMessage(
      response.ok ? "KYC details confirmed." : "Could not confirm details.",
    );
  }

  return (
    <main>
      <section className="card">
        <h1>KYC document check</h1>
        <p className="sub">
          Upload a PAN or Aadhaar card image. Review extracted fields before
          confirming.
        </p>
        <form onSubmit={scan}>
          <label>
            Card image (JPG, PNG, WEBP, PDF, JPEG; max 5 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0])}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />{" "}
            I consent to processing this document for KYC verification.
          </label>
          <button disabled={busy}>
            {busy ? "Scanning…" : "Scan document"}
          </button>
        </form>
        {message && <p role="status">{message}</p>}
        {result && (
          <div className="result">
            <h2>Review result</h2>
            <p>
              <b>Document:</b> {result.documentType}
            </p>
            <p>
              <b>Identifier:</b> {result.identifierMasked}
            </p>
            <label>
              Full name
              <input
                value={result.name || ""}
                onChange={(e) => setResult({ ...result, name: e.target.value })}
              />
            </label>
            <label>
              Date of birth
              <input
                type="date"
                value={result.dateOfBirth || ""}
                onChange={(e) =>
                  setResult({ ...result, dateOfBirth: e.target.value })
                }
              />
            </label>
            <button onClick={confirm}>Confirm details</button>
          </div>
        )}
      </section>
    </main>
  );
  
}
