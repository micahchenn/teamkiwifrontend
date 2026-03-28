import { useMemo, useState } from 'react';
import { isDayUnavailableDemo, stripTime } from './bookingDateUtils';
import './BookingCalendar.css';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * @param {object} props
 * @param {Set<number>} props.selectedTimestamps — stripTime keys for each selected day (range inclusive)
 * @param {(day: Date) => void} props.onDayClick
 */
export default function BookingCalendar({ selectedTimestamps, onDayClick }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const { year, monthIndex, weeks } = useMemo(
    () => buildMonthGrid(visibleMonth),
    [visibleMonth]
  );

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex, 1));

  function goPrev() {
    setVisibleMonth(new Date(year, monthIndex - 1, 1));
  }

  function goNext() {
    setVisibleMonth(new Date(year, monthIndex + 1, 1));
  }

  function handleDayClick(day) {
    if (!day || isDayUnavailableDemo(day)) return;
    onDayClick(day);
  }

  const selected =
    selectedTimestamps instanceof Set ? selectedTimestamps : new Set(selectedTimestamps || []);

  return (
    <div className="booking-cal">
      <div className="booking-cal__month-row">
        <button type="button" className="booking-cal__nav booking-cal__nav--prev" onClick={goPrev} aria-label="Previous month">
          ‹
        </button>
        <span className="booking-cal__month-title">{monthLabel}</span>
        <button type="button" className="booking-cal__nav booking-cal__nav--next" onClick={goNext} aria-label="Next month">
          ›
        </button>
      </div>

      <div className="booking-cal__weekdays" role="row">
        {WEEKDAYS.map((w) => (
          <span key={w} className="booking-cal__weekday" role="columnheader">
            {w}
          </span>
        ))}
      </div>

      <div className="booking-cal__grid" role="grid" aria-label="Select visit dates">
        {weeks.map((row, ri) => (
          <div key={ri} className="booking-cal__row" role="row">
            {row.map((cell, ci) => (
              <DayCell
                key={`${ri}-${ci}`}
                day={cell}
                selectedTimestamps={selected}
                onClick={() => handleDayClick(cell)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="booking-cal__legend">
        <span className="booking-cal__legend-item">
          <span className="booking-cal__swatch booking-cal__swatch--avail" /> Available
        </span>
        <span className="booking-cal__legend-item">
          <span className="booking-cal__swatch booking-cal__swatch--no" /> No vacancy
        </span>
        <span className="booking-cal__legend-item">
          <span className="booking-cal__swatch booking-cal__swatch--sel" /> Selected
        </span>
      </div>
    </div>
  );
}

function DayCell({ day, selectedTimestamps, onClick }) {
  if (!day) {
    return <div className="booking-cal__cell booking-cal__cell--empty" />;
  }

  const unavailable = isDayUnavailableDemo(day);
  const selected = selectedTimestamps.has(stripTime(day));

  let mod = '';
  if (unavailable) mod = ' booking-cal__cell--unavailable';
  else if (selected) mod = ' booking-cal__cell--selected';
  else mod = ' booking-cal__cell--available';

  return (
    <button
      type="button"
      className={`booking-cal__cell${mod}`}
      onClick={onClick}
      disabled={unavailable}
      aria-pressed={selected}
      aria-label={
        unavailable
          ? `${day.getDate()}, no vacancy`
          : `${day.getDate()}, ${selected ? 'selected' : 'available'}`
      }
    >
      <span className="booking-cal__day-num">{day.getDate()}</span>
    </button>
  );
}

function buildMonthGrid(monthStart) {
  const year = monthStart.getFullYear();
  const monthIndex = monthStart.getMonth();
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();

  const cells = [];

  for (let i = 0; i < startPad; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, monthIndex, d));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return { year, monthIndex, weeks };
}
