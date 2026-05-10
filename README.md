# ProGemel — Profit Financial Group

אתר השוואת מסלולי חיסכון: קרנות השתלמות, פוליסות חיסכון, קרנות פנסיה, קופות גמל, גמל להשקעה.

## מבנה הפרויקט

```
progemel/
├── index.html                    ← נקודת כניסה HTML
├── vite.config.js                ← הגדרות Vite
├── package.json
├── public/
│   └── logo.png                  ← לוגו Profit Financial Group
└── src/
    ├── main.jsx                  ← React entry point
    ├── App.jsx                   ← אפליקציה ראשית (UI + state)
    ├── data/
    │   └── raw_data.json         ← כל הנתונים (מ-Excel)
    └── utils/
        ├── classifier.js         ← סיווג מסלולים לפי חשיפות
        └── dataLoader.js         ← טעינה ועיבוד נתונים
```

## התקנה והרצה מקומית

```bash
cd progemel
npm install
npm run dev
```

## בנייה לפרודקשן

```bash
npm run build
# תוצרים ב-dist/
```

## פריסה ל-GitHub Pages

```bash
# 1. צור repository חדש ב-GitHub
# 2. הגדר vite.config.js → base: '/progemel/' (שם ה-repo)
# 3. הוסף ל-package.json:
#    "homepage": "https://USERNAME.github.io/progemel"
# 4. התקן gh-pages:
npm install --save-dev gh-pages
# 5. הוסף scripts ל-package.json:
#    "predeploy": "npm run build"
#    "deploy": "gh-pages -d dist"
# 6. פרוס:
npm run deploy
```

## פריסה ל-Vercel / Netlify

ב-Vercel: חבר GitHub repo → Framework: Vite → Deploy.
ב-Netlify: גרור את תיקיית dist/ לממשק Netlify.

## הוספת מדד פרופיט

כרגע `profit_index` מוגדר כ-null בכל הנתונים.
להוסיף את המדד:
1. פתח `src/data/raw_data.json`
2. לכל קרן הוסף שדה: `"profit_index": 85.3`
3. או טען מ-Google Sheets על ידי הוספת loader ב-`src/utils/dataLoader.js`

## עדכון נתונים

כשמגיע עדכון חודשי מה-Excel:
1. החלף את קבצי ה-XLSX
2. הרץ מחדש את סקריפט הפרסינג (Python) שיצר את `raw_data.json`
3. `npm run build && npm run deploy`

## צ'קליסט לפני השקה

- [ ] הגדר base URL ב-vite.config.js
- [ ] הוסף מדד פרופיט לנתונים
- [ ] בדוק RTL בכל הדפדפנים
- [ ] הוסף Google Analytics
- [ ] הגדר domain מותאם אישית
- [ ] הוסף ניתוח AI (Anthropic API) לפאנל הפרטים

## טכנולוגיות

- **React 18** — UI
- **Vite** — bundler
- **ללא dependencies חיצוניים** — גרפים ב-SVG מובנה, עיצוב ב-CSS-in-JS

## צוות

Profit Financial Group © 2025
