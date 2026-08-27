Frontend integriert die Endpoints der API https://all-api-node.vercel.app

Aktuell nur:
- /login -> OAuth via GitHub oder GitLab (Browser-Redirects zu /api/v1/auth/github oder /api/v1/auth/gitlab über die Proxy-Route)
- /logout -> Logout (POST /api/v1/auth/logout)

Vor jeder Weiterleitung an die API führt die Proxy-Route einen Health-Check auf /api/v1/health aus. Wenn der Health-Check fehlschlägt, liefert die Proxy-Route Status 503 zurück.

Die Next.js Proxy-Route befindet sich unter /app/api/proxy/[...path]/route.ts und leitet Requests an die API weiter. Die Ziel-URL kann in .env.local über API_BASE konfiguriert werden.

Starten:
1. npm run dev
2. Öffne http://localhost:3000

Hinweis:
- Die Login-Buttons nutzen direkte Browser-Redirects, damit OAuth-Weiterleitungen korrekt funktionieren.
- Wenn die API andere Provider-Endpunkte verwendet, Pfade in app/login/page.tsx anpassen.
