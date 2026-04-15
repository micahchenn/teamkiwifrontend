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
  "customerPhone": "+1...",
  "guestEmails": ["john@example.com"]
}
```

- **`guests`** — One entry per **adult** (same order as checkout: adult 1, adult 2, …). Length equals **`booking.adults`**. Each object may include optional **`phone`** (per adult). Top-level **`customerPhone`** is adult 1’s phone when provided (for Square receipts).
- **`customerName` / `customerEmail`** — Copy of **guest 1** (payer / primary) for Square receipts and backward compatibility.
- **`guestEmails`** (top-level, optional) — Same shape as inside **`booking`**: extra inboxes for confirmations. The app sends **both** top-level and **`booking.guestEmails`** (same list) so serializers that only whitelist payment-root fields still receive recipients. Server merges/dedupes with **`customerEmail`** (payer first, case-insensitive).

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
    "guestEmails": ["john@example.com"],
    "guests": [
      { "fullName": "Jane Doe", "email": "jane@example.com", "phone": "+13255550100" },
      { "fullName": "John Doe", "email": "john@example.com" }
    ]
  }
}
```

**`adults` and `children` (integers):** Always included on `booking` after payment (normalized on the client). Email / SendGrid templates use these for copy and disclaimers — e.g. **`children` must be present** (`0` if none). If `children` is omitted or `0`, kid-related disclaimer blocks stay off; use **`children: 1`** (or more) when the party includes children so templates can show the disclaimer. Pass the full `booking` dict (including `guests`) into `build_booking_dynamic_template_data` / `send_booking_confirmation_email` on the backend.

**SendGrid:** After you change templates, **re-upload `email.html`** into the SendGrid dynamic template (or paste the updated HTML). Use **`children: 1`** (and codes) in `send_template_test_email` so test sends show the disclaimer.

**`guestEmails` in `booking` (optional array of strings):** Same list as top-level when present — extra addresses for the same confirmation email. Adults 2+ emails, **excluding** the payer, **deduped** case-insensitively on the client. Your backend may also merge **`guest_emails`**, **`additionalEmails`**, **`ccEmails`**, **`emails`**, **`users`**, etc. — see your API.

**Why:** The payer is only **`customerEmail`**. Without **`guestEmails`** (top-level and/or in **`booking`**), only one inbox gets mail. DRF may only expose **`guestEmails`** on the payment serializer at the **root** — sending it **both** places keeps serializers and `collect_booking_confirmation_recipients` aligned.

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

## Admin bulk code sender endpoint

The frontend route `"/admin/codes"` expects this backend endpoint:

- `POST /api/admin/codes/send`

Example request:

```json
{
  "adminPassword": "your-admin-password",
  "codeType": "crappie_house_guest_access",
  "recipients": [
    { "email": "guest1@example.com", "startDate": "2026-04-20", "endDate": "2026-04-22" },
    { "email": "guest2@example.com", "startDate": "2026-04-20", "endDate": "2026-04-20" }
  ]
}
```

Expected backend behavior:

1. Validate `adminPassword` against server-side secret.
2. For each recipient row, generate a random one-time code.
3. Store the code and date validity window in your DB.
4. Email that code to the row email.
5. Return a per-row send summary.

Suggested response shape:

```json
{
  "sentCount": 2,
  "failedCount": 0,
  "sent": [
    { "email": "guest1@example.com", "code": "HLC-9Q2M7A" },
    { "email": "guest2@example.com", "code": "HLC-4TZ8KJ" }
  ],
  "failed": []
}
```
