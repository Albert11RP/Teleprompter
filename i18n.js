/**
 * Sistema simple d'internacionalització amb arxius JSON.
 * Exposa window.i18n amb: t(key, vars), setLocale(code), getLocale(), onChange(cb),
 * applyTranslations(root).
 */
(function () {
    const STORAGE_KEY = 'teleprompter_locale';
    const DEFAULT_LOCALE = 'ca';
    const AVAILABLE_LOCALES = ['ca', 'es', 'en', 'fr', 'zh', 'hi', 'ar'];

    const cache = {};
    let currentLocale = DEFAULT_LOCALE;
    let currentDict = null;
    const listeners = new Set();

    function detectInitialLocale() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && AVAILABLE_LOCALES.includes(stored)) return stored;

        const nav = (navigator.language || 'ca').toLowerCase();
        const short = nav.split('-')[0];
        if (AVAILABLE_LOCALES.includes(short)) return short;

        return DEFAULT_LOCALE;
    }

    async function loadLocale(code) {
        if (cache[code]) return cache[code];
        try {
            const res = await fetch(`locales/${code}.json`, { cache: 'no-cache' });
            if (!res.ok) throw new Error(`Failed to load ${code}`);
            const data = await res.json();
            cache[code] = data;
            return data;
        } catch (err) {
            console.warn(`No s'ha pogut carregar l'idioma ${code}:`, err);
            if (code !== DEFAULT_LOCALE) return loadLocale(DEFAULT_LOCALE);
            return {};
        }
    }

    function getByPath(obj, path) {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
    }

    function interpolate(str, vars) {
        if (!vars) return str;
        return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
            vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
        );
    }

    function t(key, vars) {
        const value = getByPath(currentDict, key);
        if (typeof value !== 'string') return key;
        return interpolate(value, vars);
    }

    function applyTranslations(root = document) {
        root.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.getAttribute('data-i18n');
            const val = t(key);
            if (val && val !== key) el.textContent = val;
        });

        root.querySelectorAll('[data-i18n-html]').forEach((el) => {
            const key = el.getAttribute('data-i18n-html');
            const val = t(key);
            if (val && val !== key) el.innerHTML = val;
        });

        root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
            const spec = el.getAttribute('data-i18n-attr');
            spec.split(';').forEach((pair) => {
                const [attr, key] = pair.split(':').map((s) => s.trim());
                if (attr && key) {
                    const val = t(key);
                    if (val && val !== key) el.setAttribute(attr, val);
                }
            });
        });
    }

    function applyDirection() {
        const dir = currentDict?.dir === 'rtl' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', currentLocale);
    }

    async function setLocale(code, persist = true) {
        if (!AVAILABLE_LOCALES.includes(code)) code = DEFAULT_LOCALE;
        currentLocale = code;
        currentDict = await loadLocale(code);
        if (persist) localStorage.setItem(STORAGE_KEY, code);
        applyDirection();
        applyTranslations();
        listeners.forEach((cb) => {
            try { cb(code); } catch (e) { console.error(e); }
        });
    }

    function onChange(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
    }

    function populateSelect(selectEl) {
        if (!selectEl) return;
        selectEl.innerHTML = '';

        Promise.all(AVAILABLE_LOCALES.map(loadLocale)).then((dicts) => {
            AVAILABLE_LOCALES.forEach((code, i) => {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = dicts[i]?.languageName || code;
                if (code === currentLocale) opt.selected = true;
                selectEl.appendChild(opt);
            });
        });

        selectEl.addEventListener('change', (e) => {
            setLocale(e.target.value);
        });
    }

    const LOCALE_FLAGS = {
        ca: '🏴󠁥󠁳󠁣󠁴󠁿',
        es: '🇪🇸',
        en: '🇬🇧',
        fr: '🇫🇷',
        zh: '🇨🇳',
        hi: '🇮🇳',
        ar: '🇸🇦',
    };

    async function getLanguageNames() {
        const dicts = await Promise.all(AVAILABLE_LOCALES.map(loadLocale));
        return AVAILABLE_LOCALES.map((code, i) => ({
            code,
            name: dicts[i]?.languageName || code,
            flag: LOCALE_FLAGS[code] || '',
        }));
    }

    window.i18n = {
        t,
        setLocale,
        getLocale: () => currentLocale,
        getAvailableLocales: () => [...AVAILABLE_LOCALES],
        getLanguageNames,
        onChange,
        applyTranslations,
        populateSelect,
        ready: null,
    };

    // Bootstrap automàtic
    const initialLocale = detectInitialLocale();
    window.i18n.ready = setLocale(initialLocale, false);
})();
