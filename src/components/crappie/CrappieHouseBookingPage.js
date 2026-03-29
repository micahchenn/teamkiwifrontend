import { useMemo, useState } from 'react';
import GuestsDropdown, { formatGuestsSummary } from '../GuestsDropdown';
import BookingCalendar from './BookingCalendar';
import {
  eachDayInRange,
  isDayUnavailableDemo,
  rangeHasBlockedDay,
  sameDay,
  stripTime,
  toDateOnlyString,
} from './bookingDateUtils';
import sampleImage from '../../images/sampleimage.jpg';
import SquareCheckoutModal from './SquareCheckoutModal';
import './CrappieHouseBookingPage.css';

const DAY_PASS_CENTS = 1500;

function formatLong(d) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

function formatRangeLine(start, end) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export default function CrappieHouseBookingPage() {
  const [guests, setGuests] = useState({ adults: 1, children: 0 });
  const [range, setRange] = useState({ start: null, end: null });
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const selectedTimestamps = useMemo(() => {
    if (!range.start) return new Set();
    const end = range.end ?? range.start;
    const t0 = stripTime(range.start);
    const t1 = stripTime(end);
    const start = t0 <= t1 ? range.start : end;
    const last = t0 <= t1 ? end : range.start;
    return new Set(eachDayInRange(start, last).map(stripTime));
  }, [range]);

  const dayCount = selectedTimestamps.size;
  const isMultiDay = dayCount > 1;
  const canContinue = range.start != null;

  const totalCents = useMemo(() => {
    const people = guests.adults + guests.children;
    return DAY_PASS_CENTS * people * Math.max(1, dayCount);
  }, [guests.adults, guests.children, dayCount]);

  const orderNote = useMemo(() => {
    if (!range.start) return 'Crappie House day pass';
    let visit;
    if (!range.end || sameDay(range.start, range.end)) {
      visit = formatLong(range.start);
    } else {
      visit = `${formatRangeLine(range.start, range.end)} (${dayCount} days)`;
    }
    return `Crappie House · ${visit} · ${formatGuestsSummary(guests.adults, guests.children)}`;
  }, [range.start, range.end, dayCount, guests.adults, guests.children]);

  const checkoutSummary = useMemo(() => {
    const people = guests.adults + guests.children;
    let visitLine = '—';
    if (range.start) {
      visitLine =
        !range.end || sameDay(range.start, range.end)
          ? formatLong(range.start)
          : formatRangeLine(range.start, range.end);
    }
    return {
      visitLine,
      guestsLine: formatGuestsSummary(guests.adults, guests.children),
      pricingLine: `$${(DAY_PASS_CENTS / 100).toFixed(0)} × ${people} ${people === 1 ? 'person' : 'people'} × ${dayCount} ${dayCount === 1 ? 'day' : 'days'}`,
    };
  }, [range.start, range.end, dayCount, guests.adults, guests.children]);

  /** Sent with the payment POST for your backend / Square note. */
  const checkoutBooking = useMemo(() => {
    if (!range.start) return null;
    const end = range.end ?? range.start;
    const t0 = stripTime(range.start);
    const t1 = stripTime(end);
    const first = t0 <= t1 ? range.start : end;
    const last = t0 <= t1 ? end : range.start;
    const people = guests.adults + guests.children;
    return {
      product: 'crappie_house_day_pass',
      visitStart: toDateOnlyString(first),
      visitEnd: toDateOnlyString(last),
      dayCount,
      adults: guests.adults,
      children: guests.children,
      people,
      dayPassCents: DAY_PASS_CENTS,
      totalCents,
    };
  }, [range.start, range.end, dayCount, guests.adults, guests.children, totalCents]);

  function handleDayClick(day) {
    setRange((prev) => {
      if (!prev.start || (prev.start && prev.end)) {
        return { start: day, end: null };
      }
      if (sameDay(prev.start, day)) {
        return { start: day, end: null };
      }
      const t0 = stripTime(prev.start);
      const t1 = stripTime(day);
      const start = t0 <= t1 ? prev.start : day;
      const end = t0 <= t1 ? day : prev.start;
      if (rangeHasBlockedDay(start, end, isDayUnavailableDemo)) {
        return prev;
      }
      return { start, end };
    });
  }

  const isRange =
    range.start != null && range.end != null && !sameDay(range.start, range.end);

  let col1Label = 'Visit date';
  let col1Value = '—';
  let col2Label = 'Pass type';
  let col2Value = 'Day pass';
  let col2Muted = true;

  if (range.start) {
    if (isRange) {
      col1Label = 'Start date';
      col1Value = formatLong(range.start);
      col2Label = 'End date';
      col2Value = formatLong(range.end);
      col2Muted = false;
    } else {
      col1Value = formatLong(range.start);
    }
  }

  return (
    <div className="ch-page">
      <section className="ch-hero ch-box" aria-labelledby="ch-hero-title">
        <p className="ch-badge">Crappie House is OPEN!</p>
        <h1 id="ch-hero-title" className="ch-hero__title">
          Cast a line at the historic Crappie House
        </h1>
        <p className="ch-hero__lead">
          Our enclosed and shaded Crappie House has changed over the years — but the fun and memories
          are passed on for generations!
        </p>
      </section>

      <div className="ch-layout">
        <div className="ch-layout__main">
          <section className="ch-box ch-info-grid" aria-label="Pricing and access">
            <article className="ch-card">
              <h2 className="ch-card__title">Day pass</h2>
              <p className="ch-card__price">
                <span className="ch-card__amount">$15</span>
                <span className="ch-card__unit"> / person</span>
              </p>
              <p className="ch-card__meta">12:01am to midnight (new pass after midnight)</p>
            </article>
            <article className="ch-card ch-card--accent">
              <h2 className="ch-card__title">Overnight guests</h2>
              <p className="ch-card__body">
                All overnight guests staying at the Hi-Line receive{' '}
                <strong>free 24/7 access</strong> to the Crappie House.
              </p>
            </article>
          </section>

          <section className="ch-box ch-about" aria-labelledby="ch-about-title">
            <h2 id="ch-about-title" className="ch-about__title">
              About the space
            </h2>
            <figure className="ch-about__figure">
              <img
                className="ch-about__img"
                src={sampleImage}
                alt="Crappie House at Hi-Line Resort"
                width={960}
                height={640}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <p className="ch-about__text">
              Rules, amenities, and more details can go here.
            </p>
          </section>
        </div>

        <aside className="ch-layout__aside">
          <div className="ch-booking-widget" id="crappie-booking">
            <header className="ch-booking-widget__head">
              <h2 className="ch-booking-widget__title">Search</h2>
              <p className="ch-booking-widget__sub">
                What dates will you visit the Crappie House?
              </p>
            </header>

            <div className="ch-booking-widget__body">
              <GuestsDropdown
                id="ch-guests"
                value={guests}
                onChange={setGuests}
                label="Guests"
              />

              {guests.children > 0 && (
                <p className="ch-children-note" role="note">
                  Children are <strong>$15 per person per day</strong> (same as adults). Children must stay with a paying
                  adult at the Crappie House. At checkout we only collect name and email for adults.
                </p>
              )}

              <div className="ch-field ch-field--row">
                <div className="ch-field__head">
                  <span className="ch-field__label">Dates</span>
                  <span className={`ch-chip${isMultiDay ? ' ch-chip--multi' : ''}`}>
                    {isMultiDay ? 'Multi-day' : 'Day pass'}
                  </span>
                </div>

                <div className="ch-date-summary">
                  <div className="ch-date-summary__col">
                    <span className="ch-date-summary__lbl ch-date-summary__lbl--in">{col1Label}</span>
                    <span className="ch-date-summary__val">{col1Value}</span>
                  </div>
                  <span className="ch-date-summary__arrow" aria-hidden>
                    →
                  </span>
                  <div className="ch-date-summary__col">
                    <span className="ch-date-summary__lbl">{col2Label}</span>
                    <span
                      className={
                        col2Muted
                          ? 'ch-date-summary__val ch-date-summary__val--muted'
                          : 'ch-date-summary__val'
                      }
                    >
                      {col2Value}
                    </span>
                  </div>
                </div>

                <BookingCalendar selectedTimestamps={selectedTimestamps} onDayClick={handleDayClick} />

                <p className="ch-cal-hint">
                  <span className="ch-cal-hint__icon" aria-hidden>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </span>
                  <span className="ch-cal-hint__text">Select all the days you want to fish</span>
                </p>
              </div>

              <button
                type="button"
                className="ch-btn-search"
                disabled={!canContinue}
                onClick={() => {
                  if (!canContinue || !range.start) return;
                  setCheckoutOpen(true);
                }}
              >
                Continue to checkout
              </button>
              {!canContinue && (
                <p className="ch-continue-hint">Select at least one available date on the calendar to continue.</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      <SquareCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onEditBooking={() => {
          setCheckoutOpen(false);
          window.requestAnimationFrame(() => {
            document.getElementById('crappie-booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
        amountCents={totalCents}
        orderNote={orderNote}
        booking={checkoutBooking}
        adultsCount={guests.adults}
        childrenCount={guests.children}
        summary={checkoutSummary}
      />
    </div>
  );
}
