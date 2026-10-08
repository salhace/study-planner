# مخطط المذاكرة | Study Planner

تطبيق ويب يولّد جدول مذاكرة تلقائي حسب المواد وتواريخ الامتحانات وساعات الفراغ، ويضيف الجلسات مباشرة إلى Google Calendar.

## كيف تشتغل الخوارزمية
لكل جلسة متاحة، تُختار المادة صاحبة أعلى أولوية:

`الأولوية = الصعوبة × (1 + 4 ÷ الأيام المتبقية) ÷ (جلسات المادة + 1)`

مع تقليل الأولوية ×0.6 لو كانت نفس مادة الجلسة السابقة. الخوارزمية في `server/scheduler.js` وعليها اختبارات Jest.

## البنية
- `client/` واجهة React (Vite)
- `server/` واجهة API بـ Node + Express، وتسجيل دخول Google OAuth

## التشغيل محلياً
```bash
# الطرفية الأولى
cd server && cp .env.example .env && npm install && npm run dev

# الطرفية الثانية
cd client && npm install && npm run dev
```
افتحي http://localhost:5173

## الاختبارات
```bash
cd server && npm test
```

## ربط Google Calendar
1. من Google Cloud Console أنشئي مشروع وفعّلي Google Calendar API.
2. أنشئي OAuth client (Web) وأضيفي redirect URI: `http://localhost:5173/auth/callback`
3. ضعي `GOOGLE_CLIENT_ID` و `GOOGLE_CLIENT_SECRET` في `server/.env`.

## التطوير القادم
- [ ] حفظ الجداول في قاعدة بيانات
- [ ] نشر الخادم على Render
- [ ] تحسين الخوارزمية لأوقات الذروة والراحة
