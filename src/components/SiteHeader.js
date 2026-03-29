import { useCallback, useEffect, useId, useState } from 'react';
import logoSrc from '../logo.svg';
import './SiteHeader.css';

function normalizePath(path) {
  if (path == null || path === '') return '/';
  const t = path.replace(/\/$/, '') || '/';
  return t;
}

/** Main resort marketing site: https://www.hilineresort.com */
export const RESORT_SITE_ORIGIN = 'https://www.hilineresort.com';

/** ResNexus booking — same as “Book” on the main site. */
export const RESORT_BOOKING_URL =
  'https://resnexus.com/resnexus/reservations/book/D4E8E8CE-3820-4F96-9C0F-9AEDC64A2A4E';

export const DEFAULT_NAV_LINKS = [
  { label: 'Home', href: `${RESORT_SITE_ORIGIN}/` },
  { label: 'About', href: `${RESORT_SITE_ORIGIN}/about` },
  { label: 'Accommodations', href: `${RESORT_SITE_ORIGIN}/accommodations` },
  { label: 'Good Times', href: `${RESORT_SITE_ORIGIN}/good-times` },
  { label: 'Fishing', href: `${RESORT_SITE_ORIGIN}/fishing` },
  { label: 'Contact', href: `${RESORT_SITE_ORIGIN}/contact` },
  { label: 'Book Now', href: RESORT_BOOKING_URL },
];

function isExternalHref(href) {
  return /^https?:\/\//i.test(href);
}

function PhoneIcon() {
  return (
    <svg
      className="site-header__phone-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V21c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <span className="site-header__burger" aria-hidden>
      <span className={`site-header__burger-line ${open ? 'site-header__burger-line--t' : ''}`} />
      <span className={`site-header__burger-line ${open ? 'site-header__burger-line--m' : ''}`} />
      <span className={`site-header__burger-line ${open ? 'site-header__burger-line--b' : ''}`} />
    </span>
  );
}

/**
 * Hi-Line Resort–style primary top bar: logo (left), nav (center column), phone (right).
 * Below `--site-header-nav-breakpoint` nav moves into a hamburger drawer.
 */
export default function SiteHeader({
  navLinks = DEFAULT_NAV_LINKS,
  phoneDisplay = '325-379-1065',
  phoneTel = 'tel:+13253791065',
  homeHref = `${RESORT_SITE_ORIGIN}/`,
  className = '',
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [pathname, setPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );
  const navId = useId();
  const toggleId = `${navId}-menu-toggle`;

  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const closeNav = useCallback(() => setNavOpen(false), []);
  const toggleNav = useCallback(() => setNavOpen((o) => !o), []);

  useEffect(() => {
    if (!navOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeNav();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [navOpen, closeNav]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 56.3125rem)');
    const onChange = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <header
      className={`site-header ${navOpen ? 'site-header--nav-open' : ''} ${className}`.trim()}
      role="banner"
    >
      <div className="site-header__inner">
        <a
          className="site-header__brand"
          href={homeHref}
          {...(isExternalHref(homeHref) ? { rel: 'noopener noreferrer' } : {})}
        >
          <img
            className="site-header__logo"
            src={logoSrc}
            alt="Hi-Line Resort"
            width={200}
            height={72}
            decoding="async"
          />
        </a>

        <button
          type="button"
          id={toggleId}
          className="site-header__toggle"
          aria-expanded={navOpen}
          aria-controls={`${navId}-menu`}
          onClick={toggleNav}
        >
          <MenuIcon open={navOpen} />
          <span className="site-header__toggle-label">{navOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav className="site-header__nav" id={`${navId}-menu`} aria-label="Main">
          <ul className="site-header__nav-list">
            {navLinks.map((item) => {
              const external = isExternalHref(item.href);
              const pathNorm = normalizePath(pathname);
              const hrefNorm = external ? '' : normalizePath(item.href);
              const isCurrent = !external && pathNorm === hrefNorm;
              return (
                <li key={item.label} className="site-header__nav-item">
                  <a
                    className={`site-header__nav-link${isCurrent ? ' site-header__nav-link--active' : ''}`}
                    href={item.href}
                    {...(external ? { rel: 'noopener noreferrer' } : {})}
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={() => closeNav()}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="site-header__actions">
          <a className="site-header__phone" href={phoneTel}>
            <PhoneIcon />
            <span>{phoneDisplay}</span>
          </a>
        </div>
      </div>

      {navOpen ? (
        <button
          type="button"
          className="site-header__backdrop"
          aria-label="Close menu"
          onClick={closeNav}
        />
      ) : null}
    </header>
  );
}
