# Team Kiwi / Hi-Line Resort frontend

React app (Create React App, JavaScript). Currently focused on **layout and design** (header, future booking UI). Backend API wiring can be added when the Django endpoints are ready.

## Prerequisites

- Node.js 18+ recommended

## Setup

```bash
npm install
```

### Header font (Menco Bold)

Nav links use **Adobe Fonts — Menco** at 700 with your specified size and color. Add your Web Project embed once:

1. In [Adobe Fonts](https://fonts.adobe.com/fonts/menco), add **Menco Bold** to a **Web Project** and open **Embed**.
2. Copy the stylesheet URL (`https://use.typekit.net/xxxxxxx.css`).
3. In `public/typekit.css`, uncomment the `@import` line and paste your kit URL, then save.

Until the kit is loaded, the browser falls back to **Montserrat** for nav text.

## Run

```bash
npm start
```

Opens the dev server (usually [http://localhost:3000](http://localhost:3000)).

## Production build

```bash
npm run build
```

Serve the `build/` folder as static files from your host.

When you integrate a Django API later, use a `REACT_APP_*` env var for the public base URL (Create React App only exposes variables prefixed with `REACT_APP_`). Do not commit secrets—only the public API origin.
