import { useCallback, useEffect, useId, useState } from 'react';
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import './SquareCheckoutModal.css';

/** Backend base URL (Django, etc.). Same origin not required — backend must allow CORS for the dev site. */
const paymentApiBase = (
  process.env.REACT_APP_PAYMENT_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

function moneyFromCents(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/**
 * @param {object} props
 * @param {{ visitLine: string, guestsLine: string, pricingLine: string }} props.summary
 * @param {object | null} [props.booking] Visit dates, guest counts, totals (for your backend)
 */
export default function SquareCheckoutModal({
  open,
  onClose,
  amountCents,
  orderNote,
  booking,
  summary,
  onSuccess,
  onEditBooking,
}) {
  const baseId = useId();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactError, setContactError] = useState(null);

  const [bookingReference, setBookingReference] = useState('');

  useEffect(() => {
    if (!open) return;
    setBookingReference(
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `bk-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    );
  }, [open]);

  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [payError, setPayError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setFullName('');
      setEmail('');
      setPhone('');
      setContactError(null);
      setConfig(null);
      setConfigError(null);
      setPayError(null);
      setPaying(false);
      setDone(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${paymentApiBase}/api/square/config`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load Square config');
        if (cancelled) return;
        setConfig(data);
        setConfigError(null);
      } catch (e) {
        if (!cancelled) setConfigError(e.message || 'Config failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  function validateContact() {
    const name = fullName.trim();
    const em = email.trim();
    if (name.length < 2) {
      setContactError('Please enter your full name.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setContactError('Please enter a valid email address.');
      return false;
    }
    setContactError(null);
    return true;
  }

  const cardTokenizeResponseReceived = useCallback(
    async (tokenResult) => {
      setPayError(null);
      if (tokenResult.status !== 'OK') {
        const errs = tokenResult.errors;
        const msg = Array.isArray(errs)
          ? errs.map((x) => x.message || x.type || String(x)).join(', ')
          : 'Card could not be verified';
        setPayError(msg);
        return;
      }
      const sourceId = tokenResult.token;
      if (!sourceId) {
        setPayError('No payment token returned.');
        return;
      }

      setPaying(true);
      try {
        const res = await fetch(`${paymentApiBase}/api/square/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId,
            amountCents,
            currency: 'USD',
            note: orderNote,
            referenceId: bookingReference,
            customerName: fullName.trim(),
            customerEmail: email.trim(),
            customerPhone: phone.trim() || undefined,
            ...(booking && { booking }),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment failed');
        setDone({
          ...data,
          bookingReference: data.referenceId || bookingReference,
        });
        onSuccess?.(data, {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          bookingReference,
          booking: booking || null,
        });
      } catch (e) {
        setPayError(e.message || 'Payment failed');
      } finally {
        setPaying(false);
      }
    },
    [amountCents, orderNote, onSuccess, bookingReference, fullName, email, phone, booking]
  );

  if (!open) return null;

  const visitLine = summary?.visitLine ?? '—';
  const guestsLine = summary?.guestsLine ?? '—';
  const pricingLine = summary?.pricingLine ?? '';

  return (
    <div className="sq-checkout" role="dialog" aria-modal="true" aria-labelledby={`${baseId}-title`}>
      <button type="button" className="sq-checkout__backdrop" onClick={onClose} aria-label="Close checkout" />
      <div className="sq-checkout__panel">
        <header className="sq-checkout__head">
          <div className="sq-checkout__head-main">
            <p className="sq-checkout__kicker">Hi-Line Crappie House</p>
            <h2 id={`${baseId}-title`} className="sq-checkout__title">
              Checkout
            </h2>
            <div className="sq-checkout__trust" role="group" aria-labelledby={`${baseId}-trust-label`}>
              <div className="sq-checkout__trust-mark" aria-hidden="true">
                <span className="sq-checkout__trust-icon-wrap">
                  <svg
                    className="sq-checkout__trust-svg sq-checkout__trust-svg--lock"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <span className="sq-checkout__trust-icon-wrap sq-checkout__trust-icon-wrap--card" aria-hidden="true">
                  <svg
                    className="sq-checkout__trust-svg sq-checkout__trust-svg--card"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </span>
              </div>
              <div className="sq-checkout__trust-copy">
                <p id={`${baseId}-trust-label`} className="sq-checkout__trust-label">
                  Secure payment
                </p>
                <p className="sq-checkout__subtitle">
                  Card details are entered only in Square&apos;s encrypted fields. This website never receives or stores
                  your full card number.
                </p>
              </div>
            </div>
          </div>
          <button type="button" className="sq-checkout__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="sq-checkout__grid">
          <div className="sq-checkout__main">
            {configError && <p className="sq-checkout__err">{configError}</p>}

            {done && (
              <div className="sq-checkout__success">
                <p className="sq-checkout__success-title">You&apos;re all set</p>
                <p className="sq-checkout__success-lead">
                  Thank you, <strong>{fullName.trim()}</strong>. We&apos;ll send a confirmation to{' '}
                  <strong>{email.trim()}</strong> with your visit details and pass information.
                </p>
                <p className="sq-checkout__success-detail">
                  Save the reference below for your records — you may be asked for it at check-in.
                </p>
                <ul className="sq-checkout__id-list">
                  <li>
                    <span className="sq-checkout__id-label">Confirmation #</span>
                    <code className="sq-checkout__id-value">{done.paymentId}</code>
                  </li>
                  <li>
                    <span className="sq-checkout__id-label">Payment status</span>
                    <span className="sq-checkout__id-value sq-checkout__id-value--plain">{done.status}</span>
                  </li>
                  {done.bookingReference && (
                    <li>
                      <span className="sq-checkout__id-label">Booking reference</span>
                      <code className="sq-checkout__id-value">{done.bookingReference}</code>
                    </li>
                  )}
                </ul>
                <button type="button" className="sq-checkout__primary-btn" onClick={onClose}>
                  Close
                </button>
              </div>
            )}

            {!done && step === 1 && (
              <section className="sq-checkout__card" aria-labelledby={`${baseId}-step1`}>
                <h3 id={`${baseId}-step1`} className="sq-checkout__section-title">
                  Step 1 — Contact
                </h3>
                <p className="sq-checkout__section-hint">
                  Your name and email are used for passes and confirmation only.
                </p>
                <div className="sq-checkout__fields">
                  <label className="sq-checkout__label" htmlFor={`${baseId}-name`}>
                    Full name <span className="sq-checkout__req">*</span>
                  </label>
                  <input
                    id={`${baseId}-name`}
                    className="sq-checkout__input"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                  <label className="sq-checkout__label" htmlFor={`${baseId}-email`}>
                    Email <span className="sq-checkout__req">*</span>
                  </label>
                  <input
                    id={`${baseId}-email`}
                    className="sq-checkout__input"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <label className="sq-checkout__label" htmlFor={`${baseId}-phone`}>
                    Phone <span className="sq-checkout__opt">(optional)</span>
                  </label>
                  <input
                    id={`${baseId}-phone`}
                    className="sq-checkout__input"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 555-0100"
                  />
                </div>
                {contactError && <p className="sq-checkout__err">{contactError}</p>}
                <button
                  type="button"
                  className="sq-checkout__primary-btn"
                  onClick={() => {
                    if (validateContact()) setStep(2);
                  }}
                >
                  Continue to payment
                </button>
              </section>
            )}

            {!done && step === 2 && config?.applicationId && config?.locationId && (
              <section className="sq-checkout__card" aria-labelledby={`${baseId}-step2`}>
                <div className="sq-checkout__step2-head">
                  <h3 id={`${baseId}-step2`} className="sq-checkout__section-title">
                    Step 2 — Card
                  </h3>
                  <button type="button" className="sq-checkout__text-btn" onClick={() => setStep(1)}>
                    Edit contact
                  </button>
                </div>
                <div className={`sq-checkout__square-wrap${paying ? ' sq-checkout__square-wrap--busy' : ''}`}>
                  <PaymentForm
                    applicationId={config.applicationId}
                    locationId={config.locationId}
                    cardTokenizeResponseReceived={cardTokenizeResponseReceived}
                  >
                    <CreditCard
                      buttonProps={{
                        css: {
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          backgroundColor: '#c4342f',
                          '&:hover': { backgroundColor: '#a82b27' },
                          '&:active': { backgroundColor: '#9a2622' },
                          '&:disabled': {
                            backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            color: 'rgba(0, 0, 0, 0.35)',
                          },
                        },
                      }}
                    >
                      <svg
                        className="sq-checkout__pay-lock"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Pay</span>
                    </CreditCard>
                  </PaymentForm>
                  {paying && <p className="sq-checkout__paying">Processing payment…</p>}
                </div>
                {payError && <p className="sq-checkout__err">{payError}</p>}
              </section>
            )}
          </div>

          <aside className="sq-checkout__summary" aria-label="Order summary">
            <div className="sq-checkout__summary-head">
              <h3 className="sq-checkout__summary-title">Summary</h3>
              {!done && (
                <button
                  type="button"
                  className="sq-checkout__summary-edit"
                  onClick={() => (onEditBooking ?? onClose)()}
                >
                  Edit booking
                </button>
              )}
            </div>
            <dl className="sq-checkout__dl">
              <div className="sq-checkout__dl-row">
                <dt>Visit</dt>
                <dd>{visitLine}</dd>
              </div>
              <div className="sq-checkout__dl-row">
                <dt>Guests</dt>
                <dd>{guestsLine}</dd>
              </div>
              {pricingLine && (
                <div className="sq-checkout__dl-row sq-checkout__dl-row--muted">
                  <dt>Pricing</dt>
                  <dd>{pricingLine}</dd>
                </div>
              )}
            </dl>
            <div className="sq-checkout__summary-total">
              <span className="sq-checkout__summary-total-label">Total due</span>
              <span className="sq-checkout__summary-total-amt">{moneyFromCents(amountCents)}</span>
            </div>
          </aside>        </div>

        <footer className="sq-checkout__legal" aria-label="Payment terms and privacy">
          <div className="sq-checkout__legal-inner">
            <p className="sq-checkout__legal-line">
              <span className="sq-checkout__legal-strong">Processing.</span> Payments are processed by Square, Inc. on
              behalf of Hi-Line Crappie House. We do not have access to your full card number and do not store it on
              our systems.
            </p>
            <p className="sq-checkout__legal-line">
              <span className="sq-checkout__legal-strong">Authorization.</span> By paying, you authorize the charge
              shown in your order summary for the visit and guest count you selected.
            </p>
            <p className="sq-checkout__legal-line">
              <span className="sq-checkout__legal-strong">Passes &amp; access.</span> Day passes and facility access are
              subject to posted rules, hours, and availability. Refunds and changes follow the property&apos;s policies
              where applicable.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
