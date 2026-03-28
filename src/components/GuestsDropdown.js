import { useCallback, useEffect, useId, useRef, useState } from 'react';
import './GuestsDropdown.css';

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Shared summary for display + alerts (adults / children only). */
export function formatGuestsSummary(adults, children) {
  const a = adults === 1 ? '1 Adult' : `${adults} Adults`;
  const c =
    children === 1 ? '1 Child' : children === 0 ? '0 Children' : `${children} Children`;
  return `${a}, ${c}`;
}

/**
 * Guests picker: dropdown trigger + popover with Adults / Children steppers and Apply.
 * Commits counts only when the user clicks Apply (controlled via value + onChange).
 */
export default function GuestsDropdown({
  value,
  onChange,
  minAdults = 1,
  minChildren = 0,
  maxAdults = 20,
  maxChildren = 20,
  label = 'Guests',
  id: idProp,
  className = '',
  disabled = false,
}) {
  const autoId = useId();
  const id = idProp || autoId;
  const listboxId = `${id}-listbox`;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const adults = value?.adults ?? 1;
  const children = value?.children ?? 0;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ adults, children });

  useEffect(() => {
    if (open) {
      setDraft({ adults, children });
    }
  }, [open, adults, children]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    function onDocMouseDown(e) {
      const t = e.target;
      if (
        triggerRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      ) {
        return;
      }
      close();
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  function setAdults(next) {
    setDraft((d) => ({
      ...d,
      adults: clamp(next, minAdults, maxAdults),
    }));
  }

  function setChildrenCount(next) {
    setDraft((d) => ({
      ...d,
      children: clamp(next, minChildren, maxChildren),
    }));
  }

  function apply() {
    onChange?.({ adults: draft.adults, children: draft.children });
    close();
  }

  const summary = formatGuestsSummary(adults, children);
  const canDecAdults = draft.adults > minAdults;
  const canIncAdults = draft.adults < maxAdults;
  const canDecChildren = draft.children > minChildren;
  const canIncChildren = draft.children < maxChildren;

  return (
    <div className={`guests-dd ${className}`.trim()}>
      <label className="guests-dd__label" htmlFor={id}>
        {label}
      </label>
      <div className="guests-dd__wrap">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          className={`guests-dd__trigger${open ? ' guests-dd__trigger--open' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
        >
          <span className="guests-dd__trigger-text">{summary}</span>
          <span className="guests-dd__chevron" aria-hidden>
            ▼
          </span>
        </button>

        {open && (
          <div
            ref={panelRef}
            id={listboxId}
            className="guests-dd__panel"
            role="dialog"
            aria-label={`${label} selection`}
            aria-modal="false"
          >
            <div className="guests-dd__rows">
              <GuestRow
                label="Adults"
                value={draft.adults}
                onDecrement={() => setAdults(draft.adults - 1)}
                onIncrement={() => setAdults(draft.adults + 1)}
                canDecrement={canDecAdults}
                canIncrement={canIncAdults}
              />
              <GuestRow
                label="Children"
                value={draft.children}
                onDecrement={() => setChildrenCount(draft.children - 1)}
                onIncrement={() => setChildrenCount(draft.children + 1)}
                canDecrement={canDecChildren}
                canIncrement={canIncChildren}
              />
            </div>
            <div className="guests-dd__footer">
              <button type="button" className="guests-dd__apply" onClick={apply}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GuestRow({
  label,
  value,
  onDecrement,
  onIncrement,
  canDecrement,
  canIncrement,
}) {
  return (
    <div className="guests-dd__row" role="presentation">
      <span className="guests-dd__row-label">{label}</span>
      <div className="guests-dd__controls">
        <button
          type="button"
          className="guests-dd__step"
          aria-label={`Decrease ${label}`}
          onClick={onDecrement}
          disabled={!canDecrement}
        >
          −
        </button>
        <span className="guests-dd__num" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="guests-dd__step"
          aria-label={`Increase ${label}`}
          onClick={onIncrement}
          disabled={!canIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
}
