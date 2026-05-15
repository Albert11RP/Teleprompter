# 提词器

[Català](README.md) · [Español](README.es.md) · [English](README.en.md) · [Français](README.fr.md) · **中文** · [हिन्दी](README.hi.md) · [العربية](README.ar.md)

---

轻量级的网页提词器应用,支持视频录制、双屏模式,界面已翻译为 **7 种语言**。

> 仅使用纯 HTML + CSS + JavaScript — 无需 `npm`、无需构建步骤、无依赖。

---

## 功能特性

- 脚本编辑器,实时估算时长
- 速度控制 (60–200 字/分) 与文字大小 (28–96 px)
- 两种视图模式:摄像头作为背景,或提词器加可拖动的小预览框
- 使用 `MediaRecorder` 录制视频,并直接下载 `.webm` 文件
- **双屏模式**:控制面板在主窗口,摄像头/提词器在副窗口
- 可折叠的侧边栏
- **完整的国际化**支持(使用 JSON 文件,含 RTL 支持)

---

## 可用语言

| 代码 | 语言                       | 文件                    |
| ---- | -------------------------- | ----------------------- |
| `ca` | Català (默认)              | `locales/ca.json`       |
| `es` | Español                    | `locales/es.json`       |
| `en` | English                    | `locales/en.json`       |
| `fr` | Français                   | `locales/fr.json`       |
| `zh` | 中文 (普通话)              | `locales/zh.json`       |
| `hi` | हिन्दी (印地语)              | `locales/hi.json`       |
| `ar` | العربية (阿拉伯语, RTL)     | `locales/ar.json`       |

应用首次加载时会**自动检测浏览器语言**。所选语言保存在 `localStorage`(`teleprompter_locale`)。

---

## 系统要求

- 现代浏览器 (Chrome 90+, Edge 90+, Firefox 90+, Safari 15+)
- **本地 HTTP 服务器**(用 `file://` 打开文件时摄像头无法工作)
- 摄像头和麦克风(用于录制)

---

## 如何运行应用

应用**需要本地服务器**,浏览器才会允许访问摄像头。请选择以下任一方式:

### 方式 1 — Python(推荐,许多系统已预装)

```bash
cd Teleprompter
python -m http.server 8000
```

然后在浏览器中打开 [http://localhost:8000](http://localhost:8000)。

### 方式 2 — Node.js

```bash
cd Teleprompter
npx serve .
```

或者:

```bash
npx http-server -p 8000
```

### 方式 3 — PHP

```bash
cd Teleprompter
php -S localhost:8000
```

### 方式 4 — VS Code / Cursor

安装 **Live Server** 扩展,右键点击 `index.html` → *Open with Live Server*。

---

## 如何切换语言

### 从界面切换
1. 打开侧边栏。
2. 在**朗读设置**卡片中,找到**语言**部分。
3. 从下拉菜单中选择语言。界面会立即翻译。

### 通过控制台强制设置语言
在浏览器的开发者工具控制台中:

```js
window.i18n.setLocale('en');   // ca, es, en, fr, zh, hi, ar
```

### 重置
恢复自动检测:

```js
localStorage.removeItem('teleprompter_locale');
location.reload();
```

---

## 项目结构

```
Teleprompter/
├── index.html          # 主屏幕(控制 + 预览)
├── prompter.html       # 双屏模式下的副屏幕
├── style.css           # 样式(含 RTL 支持和各字母系统的字体)
├── i18n.js             # 国际化系统
├── script.js           # 主屏幕逻辑
├── script-prompter.js  # 副屏幕逻辑
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

## 添加新语言

1. 复制已有文件,如 `locales/en.json`,改名为 `locales/<代码>.json`。
2. 翻译所有的值(保留键和占位符 `{{count}}`、`{{wpm}}`、`{{size}}`)。
3. 若是 RTL 语言,在 JSON 根处添加 `"dir": "rtl"`。
4. 编辑 `i18n.js`,在 `AVAILABLE_LOCALES` 列表中加入代码。

德语示例:

```js
const AVAILABLE_LOCALES = ['ca', 'es', 'en', 'fr', 'zh', 'hi', 'ar', 'de'];
```

语言选择器会根据此列表和每个 JSON 中的 `languageName` 字段自动填充。

---

## 键盘快捷键

| 按键            | 操作                            |
| --------------- | ------------------------------- |
| `空格`          | 暂停 / 继续录制                 |
| `Esc`           | 结束录制                        |

---

## 浏览器权限

首次开始录制时,浏览器会请求**摄像头**和**麦克风**权限。如果你拒绝了:

- 点击地址栏中的锁图标。
- 为该网站允许`摄像头`和`麦克风`。
- 刷新页面。

---

## 许可

个人和教育用途。可随意改编。
