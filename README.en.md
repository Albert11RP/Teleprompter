# Teleprompter

[Català](README.md) · [Español](README.es.md) · **English** · [Français](README.fr.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md)

---

Lightweight web teleprompter app with video recording, dual-screen support and an interface translated to **7 languages**.

> Works with pure HTML + CSS + JavaScript only — no `npm`, no build step, no dependencies.

---

## Features

- Script editor with real-time duration estimate
- Speed control (60–200 WPM) and text size (28–96 px)
- Two view modes: camera as background or teleprompter with a small draggable preview
- Video recording with `MediaRecorder` and direct `.webm` download
- **Dual-screen** mode: script on the main window, camera/teleprompter on a second window
- Collapsible sidebar
- **Full internationalization** with JSON files (including RTL support)

---

## Available languages

| Code | Language                | File                    |
| ---- | ----------------------- | ----------------------- |
| `ca` | Català (default)        | `locales/ca.json`       |
| `es` | Español                 | `locales/es.json`       |
| `en` | English                 | `locales/en.json`       |
| `fr` | Français                | `locales/fr.json`       |
| `zh` | 中文 (Mandarin Chinese)  | `locales/zh.json`       |
| `hi` | हिन्दी (Hindi)             | `locales/hi.json`       |
| `ar` | العربية (Arabic, RTL)    | `locales/ar.json`       |

The app **auto-detects the browser language** on first load. The selection is saved in `localStorage` (`teleprompter_locale`).

---

## Requirements

- A modern browser (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+)
- **A local HTTP server** (the camera does not work when opening the file with `file://`)
- Camera and microphone (for recording)

---

## How to run the app

The app **needs a local server** so the browser allows camera access. Pick one of these options:

### Option 1 — Python (recommended, already installed on many systems)

```bash
cd Teleprompter
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in the browser.

### Option 2 — Node.js

```bash
cd Teleprompter
npx serve .
```

Or:

```bash
npx http-server -p 8000
```

### Option 3 — PHP

```bash
cd Teleprompter
php -S localhost:8000
```

### Option 4 — VS Code / Cursor

Install the **Live Server** extension and right-click `index.html` → *Open with Live Server*.

---

## How to change the language

### From the UI
1. Open the sidebar.
2. In the **Reading settings** card, find the **Language** section.
3. Pick a language from the dropdown. The UI translates instantly.

### Force a language via the console
In the browser's DevTools console:

```js
window.i18n.setLocale('en');   // ca, es, en, fr, zh, hi, ar
```

### Reset
To restore auto-detection:

```js
localStorage.removeItem('teleprompter_locale');
location.reload();
```

---

## Project structure

```
Teleprompter/
├── index.html          # Main screen (control + preview)
├── prompter.html       # Secondary screen for dual-screen mode
├── style.css           # Styles (including RTL support and per-alphabet fonts)
├── i18n.js             # Internationalization system
├── script.js           # Main screen logic
├── script-prompter.js  # Secondary screen logic
├── locales/
│   ├── ca.json
│   ├── es.json
│   ├── en.json
│   ├── fr.json
│   ├── zh.json
│   ├── hi.json
│   └── ar.json
└── README.md
```

---

## Add a new language

1. Copy an existing file, e.g. `locales/en.json`, as `locales/<code>.json`.
2. Translate all values (keep the keys and placeholders `{{count}}`, `{{wpm}}`, `{{size}}`).
3. If it's an RTL language, add `"dir": "rtl"` at the JSON root.
4. Edit `i18n.js` and add the code to the `AVAILABLE_LOCALES` list.

Example for German:

```js
const AVAILABLE_LOCALES = ['ca', 'es', 'en', 'fr', 'zh', 'hi', 'ar', 'de'];
```

The language selector is populated automatically from this list and the `languageName` field of each JSON.

---

## Keyboard shortcuts

| Key             | Action                          |
| --------------- | ------------------------------- |
| `Space`         | Pause / Resume recording        |
| `Esc`           | Finish recording                |

---

## Browser permissions

The first time you start recording, the browser will ask for **camera** and **microphone** access. If you deny:

- Click the lock icon in the address bar.
- Allow `Camera` and `Microphone` for this site.
- Reload the page.

---

## License

Personal and educational use. Adapt it as you wish.
