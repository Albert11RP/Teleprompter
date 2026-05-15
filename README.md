# Teleprompter

**Català** · [Español](README.es.md) · [English](README.en.md) · [Français](README.fr.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md)

### 🚀 Demo en directe: **[free-tele-prompter.netlify.app](https://free-tele-prompter.netlify.app)**

---

Aplicació web lleugera de teleprompter amb gravació de vídeo, suport per a doble pantalla i interfície traduïda a **7 idiomes**.

> Funciona només amb HTML + CSS + JavaScript pur — sense `npm`, sense build step, sense dependències.

---

## Característiques

- Editor de guió amb estimació de durada en temps real
- Control de velocitat (60–200 PPM) i mida del text (28–96 px)
- Dos modes de visualització: càmera com a fons o teleprompter amb preview petit arrossegable
- Gravació de vídeo amb `MediaRecorder` i descàrrega directa en `.webm`
- Mode **doble pantalla**: el guió a la finestra principal i la càmera/teleprompter en una segona finestra
- Barra lateral plegable
- **Internacionalització completa** amb fitxers JSON (incloent suport RTL)

---

## Idiomes disponibles

| Codi | Idioma                | Fitxer                  |
| ---- | --------------------- | ----------------------- |
| `ca` | Català (per defecte)  | `locales/ca.json`       |
| `es` | Español               | `locales/es.json`       |
| `en` | English               | `locales/en.json`       |
| `fr` | Français              | `locales/fr.json`       |
| `zh` | 中文 (Xinès mandarí)  | `locales/zh.json`       |
| `hi` | हिन्दी (Hindi)          | `locales/hi.json`       |
| `ar` | العربية (Àrab, RTL)    | `locales/ar.json`       |

L'aplicació **detecta automàticament l'idioma del navegador** la primera vegada. La selecció es desa a `localStorage` (`teleprompter_locale`).

---

## Requisits

- Un navegador modern (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+)
- **Un servidor HTTP local** (la càmera no funciona obrint el fitxer amb `file://`)
- Càmera i micròfon (per gravar)

---

## Com executar l'app

L'app **necessita un servidor local** perquè el navegador permeti accés a la càmera. Trieu una de les opcions següents:

### Opció 1 — Python (recomanat, ja instal·lat en molts sistemes)

```bash
cd Teleprompter
python -m http.server 8000
```

I obre [http://localhost:8000](http://localhost:8000) al navegador.

### Opció 2 — Node.js

```bash
cd Teleprompter
npx serve .
```

O bé:

```bash
npx http-server -p 8000
```

### Opció 3 — PHP

```bash
cd Teleprompter
php -S localhost:8000
```

### Opció 4 — VS Code / Cursor

Instal·la l'extensió **Live Server** i fes clic dret sobre `index.html` → *Open with Live Server*.

---

## Com canviar d'idioma

### Des de la interfície
1. Obre el menú lateral.
2. A la targeta **Ajustos de lectura**, ves a l'apartat **Idioma**.
3. Tria un idioma del desplegable. La interfície es tradueix a l'instant.

### Forçar un idioma per URL o consola
A la consola del navegador (DevTools):

```js
window.i18n.setLocale('en');   // ca, es, en, fr, zh, hi, ar
```

### Reset
Per recuperar la detecció automàtica:

```js
localStorage.removeItem('teleprompter_locale');
location.reload();
```

---

## Estructura del projecte

```
Teleprompter/
├── index.html          # Pantalla principal (control + preview)
├── prompter.html       # Pantalla secundària per a mode doble pantalla
├── style.css           # Estils (incloent suport RTL i fonts per cada alfabet)
├── i18n.js             # Sistema d'internacionalització
├── script.js           # Lògica de la pantalla principal
├── script-prompter.js  # Lògica de la pantalla secundària
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

## Afegir un idioma nou

1. Copia un fitxer existent, per exemple `locales/en.json`, com a `locales/<codi>.json`.
2. Tradueix tots els valors (mantenint les claus i els marcadors `{{count}}`, `{{wpm}}`, `{{size}}`).
3. Si és un idioma RTL, afegeix `"dir": "rtl"` a l'arrel del JSON.
4. Edita `i18n.js` i afegeix el codi a la llista `AVAILABLE_LOCALES`.

Exemple per a alemany:

```js
const AVAILABLE_LOCALES = ['ca', 'es', 'en', 'fr', 'zh', 'hi', 'ar', 'de'];
```

El selector d'idioma s'omple automàticament a partir d'aquesta llista i del camp `languageName` de cada JSON.

---

## Dreceres de teclat

| Tecla           | Acció                          |
| --------------- | ------------------------------ |
| `Espai`         | Pausa / Reprèn la gravació     |
| `Esc`           | Finalitza la gravació          |

---

## Permisos del navegador

La primera vegada que iniciïs la gravació, el navegador demanarà accés a **càmera** i **micròfon**. Si denegues els permisos:

- Clica el cadenat de la barra d'adreces.
- Permet `Càmera` i `Micròfon` per a aquest lloc.
- Recarrega la pàgina.

---

## Llicència

Ús personal i educatiu. Adapta'l com vulguis.
