# Teleprompter

[Català](README.md) · **Español** · [English](README.en.md) · [Français](README.fr.md) · [中文](README.zh.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md)

---

Aplicación web ligera de teleprompter con grabación de vídeo, soporte para doble pantalla e interfaz traducida a **7 idiomas**.

> Funciona solo con HTML + CSS + JavaScript puro — sin `npm`, sin build step, sin dependencias.

---

## Características

- Editor de guion con estimación de duración en tiempo real
- Control de velocidad (60–200 PPM) y tamaño del texto (28–96 px)
- Dos modos de visualización: cámara como fondo o teleprompter con vista previa pequeña arrastrable
- Grabación de vídeo con `MediaRecorder` y descarga directa en `.webm`
- Modo **doble pantalla**: el guion en la ventana principal y la cámara/teleprompter en una segunda ventana
- Barra lateral plegable
- **Internacionalización completa** con archivos JSON (incluyendo soporte RTL)

---

## Idiomas disponibles

| Código | Idioma                  | Archivo                 |
| ------ | ----------------------- | ----------------------- |
| `ca`   | Català (por defecto)    | `locales/ca.json`       |
| `es`   | Español                 | `locales/es.json`       |
| `en`   | English                 | `locales/en.json`       |
| `fr`   | Français                | `locales/fr.json`       |
| `zh`   | 中文 (Chino mandarín)    | `locales/zh.json`       |
| `hi`   | हिन्दी (Hindi)             | `locales/hi.json`       |
| `ar`   | العربية (Árabe, RTL)     | `locales/ar.json`       |

La aplicación **detecta automáticamente el idioma del navegador** la primera vez. La selección se guarda en `localStorage` (`teleprompter_locale`).

---

## Requisitos

- Un navegador moderno (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+)
- **Un servidor HTTP local** (la cámara no funciona abriendo el archivo con `file://`)
- Cámara y micrófono (para grabar)

---

## Cómo ejecutar la app

La app **necesita un servidor local** para que el navegador permita acceso a la cámara. Elige una de las opciones siguientes:

### Opción 1 — Python (recomendado, ya instalado en muchos sistemas)

```bash
cd Teleprompter
python -m http.server 8000
```

Y abre [http://localhost:8000](http://localhost:8000) en el navegador.

### Opción 2 — Node.js

```bash
cd Teleprompter
npx serve .
```

O bien:

```bash
npx http-server -p 8000
```

### Opción 3 — PHP

```bash
cd Teleprompter
php -S localhost:8000
```

### Opción 4 — VS Code / Cursor

Instala la extensión **Live Server** y haz clic derecho sobre `index.html` → *Open with Live Server*.

---

## Cómo cambiar de idioma

### Desde la interfaz
1. Abre el menú lateral.
2. En la tarjeta **Ajustes de lectura**, ve al apartado **Idioma**.
3. Elige un idioma del desplegable. La interfaz se traduce al instante.

### Forzar un idioma por consola
En la consola del navegador (DevTools):

```js
window.i18n.setLocale('en');   // ca, es, en, fr, zh, hi, ar
```

### Reset
Para recuperar la detección automática:

```js
localStorage.removeItem('teleprompter_locale');
location.reload();
```

---

## Estructura del proyecto

```
Teleprompter/
├── index.html          # Pantalla principal (control + preview)
├── prompter.html       # Pantalla secundaria para modo doble pantalla
├── style.css           # Estilos (incluyendo soporte RTL y fuentes por alfabeto)
├── i18n.js             # Sistema de internacionalización
├── script.js           # Lógica de la pantalla principal
├── script-prompter.js  # Lógica de la pantalla secundaria
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

## Añadir un nuevo idioma

1. Copia un archivo existente, por ejemplo `locales/en.json`, como `locales/<código>.json`.
2. Traduce todos los valores (manteniendo las claves y los marcadores `{{count}}`, `{{wpm}}`, `{{size}}`).
3. Si es un idioma RTL, añade `"dir": "rtl"` a la raíz del JSON.
4. Edita `i18n.js` y añade el código a la lista `AVAILABLE_LOCALES`.

Ejemplo para alemán:

```js
const AVAILABLE_LOCALES = ['ca', 'es', 'en', 'fr', 'zh', 'hi', 'ar', 'de'];
```

El selector de idioma se rellena automáticamente a partir de esta lista y del campo `languageName` de cada JSON.

---

## Atajos de teclado

| Tecla           | Acción                          |
| --------------- | ------------------------------- |
| `Espacio`       | Pausa / Reanuda la grabación    |
| `Esc`           | Finaliza la grabación           |

---

## Permisos del navegador

La primera vez que inicies la grabación, el navegador pedirá acceso a **cámara** y **micrófono**. Si rechazas los permisos:

- Haz clic en el candado de la barra de direcciones.
- Permite `Cámara` y `Micrófono` para este sitio.
- Recarga la página.

---

## Licencia

Uso personal y educativo. Adáptalo como quieras.
