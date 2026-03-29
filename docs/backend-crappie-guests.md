# Backend: Crappie House payment + adult guest codes

The frontend sends **one row per adult** in `guests` (length **`booking.adults`**). Child day passes are priced the same but **no separate name/email** — `booking.children` counts them for totals and email disclaimers. Issue pass / confirmation **per adult row**; handle kids per your policy (e.g. covered on adult confirmation).

## `POST /api/square/payments` — relevant JSON

Top-level (along with `sourceId`, `amountCents`, `currency`, `note`, `referenceId`):

```json
{
  "guests": [
    { "fullName": "Jane Doe", "email": "jane@example.com", "phone": "+13255550100" },
    { "fullName": "John Doe", "email": "john@example.com" }
  ],
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "+1..."
}
```

- **`guests`** — One entry per **adult** (same order as checkout: adult 1, adult 2, …). Length equals **`booking.adults`**. Each object may include optional **`phone`** (per adult). Top-level **`customerPhone`** is adult 1’s phone when provided (for Square receipts).
- **`customerName` / `customerEmail`** — Copy of **guest 1** (payer / primary) for Square receipts and backward compatibility.

Embedded in **`booking`** (same `guests` array duplicated for convenience):

```json
{
  "booking": {
    "product": "crappie_house_day_pass",
    "visitStart": "2026-03-28",
    "visitEnd": "2026-03-30",
    "dayCount": 3,
    "adults": 2,
    "children": 1,
    "people": 3,
    "dayPassCents": 1500,
    "totalCents": 9000,
    "guests": [
      { "fullName": "Jane Doe", "email": "jane@example.com", "phone": "+13255550100" },
      { "fullName": "John Doe", "email": "john@example.com" }
    ]
  }
}
```

**`adults` and `children` (integers):** Always included on `booking` after payment (normalized on the client). Email / SendGrid templates use these for copy and disclaimers — e.g. **`children` must be present** (`0` if none). If `children` is omitted or `0`, kid-related disclaimer blocks stay off; use **`children: 1`** (or more) when the party includes children so templates can show the disclaimer. Pass the full `booking` dict (including `guests`) into `build_booking_dynamic_template_data` / `send_booking_confirmation_email` on the backend.

**SendGrid:** After you change templates, **re-upload `email.html`** into the SendGrid dynamic template (or paste the updated HTML). Use **`children: 1`** (and codes) in `send_template_test_email` so test sends show the disclaimer.

**Validation:** `len(booking.guests) === booking.adults`, `booking.people === booking.adults + booking.children`, and `booking.totalCents` matches `amountCents`.

## Suggested database shape (Django-style)

You can model this in two layers:

### 1. `Reservation` / `Order` (one per payment)

- `id` (UUID or PK)
- `reference_id` (from client, matches Square `reference_id`)
- `square_payment_id`
- `amount_cents`, `currency`
- `visit_start`, `visit_end`, `day_count`
- `adults`, `children`
- `phone` (optional, group contact)
- `status` (paid, cancelled, …)
- `created_at`

### 2. `ReservationGuest` or `PassHolder` (one per row in `guests`)

- `id` (PK)
- `fk` → reservation
- `sequence` (0, 1, … — order in `guests`)
- `full_name`
- `email`
- **`pass_code`** or **`token`** — unique per row (what you email / encode in QR)
- `redeemed_at` (optional)

Generate unique codes (e.g. `secrets.token_urlsafe`, or UUID) **after** payment succeeds, store one per `ReservationGuest`, send email per guest.

### 3. Idempotency

- Use `reference_id` + `square_payment_id` to avoid double-processing webhooks or retries.

This repo does **not** run migrations; implement the above in **teamkiwibackend** (or your API repo).
