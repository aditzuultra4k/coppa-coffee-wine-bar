# Coppa Coffee & Wine Bar

Site frontend si backend pentru programari Coppa Coffee & Wine Bar.

## Rulare locala

```bash
npm start
```

Site:

```text
http://localhost:3000
```

Panou staff:

```text
http://localhost:3000/staff.html
```

Parola staff implicita:

```text
coppa-staff
```

Pentru productie seteaza o parola proprie:

```bash
STAFF_PASSWORD="parola-ta" npm start
```

## Functionalitati

- Formular public pentru programari.
- API backend Node.js fara dependinte externe.
- Salvare programari in `data/reservations.json`.
- Panou staff protejat cu parola.
- Staff-ul poate vedea programarile si le poate marca drept confirmate sau anulate.

## Deploy online

Proiectul include si o ruta serverless Vercel in `api/[...path].js`, astfel incat site-ul si backend-ul sa poata fi accesate public impreuna.

```bash
npx vercel --prod
```

Pentru productie, seteaza `STAFF_PASSWORD` in variabilele de mediu din hosting.
