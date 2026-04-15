import { useMemo, useState } from 'react';
import './AdminCodesPage.css';

const apiBase = (
  process.env.REACT_APP_PAYMENT_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

const adminGatePassword = process.env.REACT_APP_ADMIN_CODES_PASSWORD || '';

function createRecipientRow() {
  return { email: '', startDate: '', endDate: '' };
}

function getTodayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function AdminCodesPage() {
  const [passwordInput, setPasswordInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [rows, setRows] = useState([
    { email: '', startDate: getTodayIso(), endDate: getTodayIso() },
  ]);

  const hasConfiguredPassword = adminGatePassword.length > 0;

  const canSend = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((row) => row.email.trim() && row.startDate.trim());
  }, [rows]);

  function onUnlock(e) {
    e.preventDefault();
    if (!hasConfiguredPassword) {
      setSubmitError(
        'Admin route password is not configured. Set REACT_APP_ADMIN_CODES_PASSWORD in the frontend environment.'
      );
      return;
    }
    if (passwordInput !== adminGatePassword) {
      setSubmitError('Incorrect admin password.');
      return;
    }
    setSubmitError(null);
    setUnlocked(true);
  }

  function setRowValue(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, createRecipientRow()]);
  }

  function removeRow(index) {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSend) {
      setSubmitError('Please complete each row with at least email and start date.');
      return;
    }
    setSubmitError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const payloadRows = rows.map((row) => ({
        email: row.email.trim(),
        startDate: row.startDate,
        endDate: row.endDate || row.startDate,
      }));

      const response = await fetch(`${apiBase}/api/admin/codes/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: passwordInput,
          recipients: payloadRows,
          codeType: 'crappie_house_guest_access',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send codes.');
      setResult(data);
    } catch (error) {
      setSubmitError(error.message || 'Failed to send codes.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!unlocked) {
    return (
      <section className="admin-codes-page" aria-labelledby="admin-codes-title">
        <div className="admin-codes-card admin-codes-card--small">
          <h1 id="admin-codes-title">Admin code sender</h1>
          <p>Password is required to access this route.</p>
          <form onSubmit={onUnlock} className="admin-codes-form">
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoComplete="current-password"
              required
            />
            {submitError && <p className="admin-codes-error">{submitError}</p>}
            <button type="submit">Unlock</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-codes-page" aria-labelledby="admin-codes-title">
      <div className="admin-codes-card">
        <h1 id="admin-codes-title">Send customer access codes</h1>
        <p>Add one row per customer. The backend generates random codes and emails each customer.</p>

        <form onSubmit={onSubmit} className="admin-codes-form">
          <div className="admin-codes-rows">
            {rows.map((row, index) => (
              <div className="admin-codes-row" key={index}>
                <label>
                  Email
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) => setRowValue(index, 'email', e.target.value)}
                    placeholder="guest@example.com"
                    required
                  />
                </label>
                <label>
                  Start date
                  <input
                    type="date"
                    value={row.startDate}
                    onChange={(e) => setRowValue(index, 'startDate', e.target.value)}
                    required
                  />
                </label>
                <label>
                  End date
                  <input
                    type="date"
                    value={row.endDate}
                    onChange={(e) => setRowValue(index, 'endDate', e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="admin-codes-remove"
                  onClick={() => removeRow(index)}
                  disabled={rows.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="admin-codes-actions">
            <button type="button" onClick={addRow}>
              Add row
            </button>
            <button type="submit" disabled={!canSend || submitting}>
              {submitting ? 'Sending...' : `Send ${rows.length} code${rows.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>

        {submitError && <p className="admin-codes-error">{submitError}</p>}

        {result && (
          <div className="admin-codes-result" role="status">
            <p>
              Completed: {result.sentCount ?? 0} sent
              {typeof result.failedCount === 'number' ? `, ${result.failedCount} failed` : ''}.
            </p>
            {Array.isArray(result.sent) && result.sent.length > 0 && (
              <ul>
                {result.sent.map((entry, i) => (
                  <li key={`${entry.email}-${i}`}>
                    {entry.email} {entry.code ? `- ${entry.code}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
