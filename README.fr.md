# Téléprompteur

[Català](README.md) · [Español](README.es.md) · [English](README.en.md) · **Français** · [中文](README.zh.md) · [हिन्दी](README.hi.md) · [العربية](README.ar.md)

---

Application web légère de téléprompteur avec enregistrement vidéo, prise en charge du double écran et interface traduite en **7 langues**.

> Fonctionne uniquement avec du HTML + CSS + JavaScript pur — sans `npm`, sans étape de build, sans dépendances.

---

## Fonctionnalités

- Éditeur de texte avec estimation de durée en temps réel
- Contrôle de la vitesse (60–200 MPM) et de la taille du texte (28–96 px)
- Deux modes d'affichage : caméra en arrière-plan ou téléprompteur avec petit aperçu déplaçable
- Enregistrement vidéo avec `MediaRecorder` et téléchargement direct en `.webm`
- Mode **double écran** : le texte sur la fenêtre principale et la caméra/téléprompteur sur une seconde fenêtre
- Barre latérale repliable
- **Internationalisation complète** avec des fichiers JSON (y compris prise en charge du RTL)

---

## Langues disponibles

| Code | Langue                   | Fichier                 |
| ---- | ------------------------ | ----------------------- |
| `ca` | Català (par défaut)      | `locales/ca.json`       |
| `es` | Español                  | `locales/es.json`       |
| `en` | English                  | `locales/en.json`       |
| `fr` | Français                 | `locales/fr.json`       |
| `zh` | 中文 (Chinois mandarin)   | `locales/zh.json`       |
| `hi` | हिन्दी (Hindi)              | `locales/hi.json`       |
| `ar` | العربية (Arabe, RTL)      | `locales/ar.json`       |

L'application **détecte automatiquement la langue du navigateur** lors du premier chargement. La sélection est enregistrée dans `localStorage` (`teleprompter_locale`).

---

## Prérequis

- Un navigateur moderne (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+)
- **Un serveur HTTP local** (la caméra ne fonctionne pas en ouvrant le fichier avec `file://`)
- Caméra et microphone (pour enregistrer)

---

## Comment exécuter l'app

L'app **nécessite un serveur local** pour que le navigateur autorise l'accès à la caméra. Choisissez une des options suivantes :

### Option 1 — Python (recommandé, déjà installé sur de nombreux systèmes)

```bash
cd Teleprompter
python -m http.server 8000
```

Puis ouvre [http://localhost:8000](http://localhost:8000) dans le navigateur.

### Option 2 — Node.js

```bash
cd Teleprompter
npx serve .
```

Ou bien :

```bash
npx http-server -p 8000
```

### Option 3 — PHP

```bash
cd Teleprompter
php -S localhost:8000
```

### Option 4 — VS Code / Cursor

Installe l'extension **Live Server** et fais un clic droit sur `index.html` → *Open with Live Server*.

---

## Comment changer de langue

### Depuis l'interface
1. Ouvre le menu latéral.
2. Dans la carte **Réglages de lecture**, va à la section **Langue**.
3. Choisis une langue dans la liste déroulante. L'interface se traduit instantanément.

### Forcer une langue via la console
Dans la console du navigateur (DevTools) :

```js
window.i18n.setLocale('en');   // ca, es, en, fr, zh, hi, ar
```

### Réinitialisation
Pour rétablir la détection automatique :

```js
localStorage.removeItem('teleprompter_locale');
location.reload();
```

---

## Structure du projet

```
Teleprompter/
├── index.html          # Écran principal (contrôle + aperçu)
├── prompter.html       # Écran secondaire pour le mode double écran
├── style.css           # Styles (y compris support RTL et polices par alphabet)
├── i18n.js             # Système d'internationalisation
├── script.js           # Logique de l'écran principal
├── script-prompter.js  # Logique de l'écran secondaire
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

## Ajouter une nouvelle langue

1. Copie un fichier existant, par exemple `locales/en.json`, en `locales/<code>.json`.
2. Traduis toutes les valeurs (en conservant les clés et les marqueurs `{{count}}`, `{{wpm}}`, `{{size}}`).
3. S'il s'agit d'une langue RTL, ajoute `"dir": "rtl"` à la racine du JSON.
4. Édite `i18n.js` et ajoute le code à la liste `AVAILABLE_LOCALES`.

Exemple pour l'allemand :

```js
const AVAILABLE_LOCALES = ['ca', 'es', 'en', 'fr', 'zh', 'hi', 'ar', 'de'];
```

Le sélecteur de langue est rempli automatiquement à partir de cette liste et du champ `languageName` de chaque JSON.

---

## Raccourcis clavier

| Touche          | Action                          |
| --------------- | ------------------------------- |
| `Espace`        | Pause / Reprend l'enregistrement|
| `Échap`         | Termine l'enregistrement        |

---

## Permissions du navigateur

La première fois que tu lances un enregistrement, le navigateur demandera l'accès à la **caméra** et au **microphone**. Si tu refuses :

- Clique sur le cadenas dans la barre d'adresse.
- Autorise `Caméra` et `Microphone` pour ce site.
- Recharge la page.

---

## Licence

Usage personnel et éducatif. Adapte-le comme tu veux.
