# Déploiement Solaire API (Cloud Run)

## Prérequis
- Node 18
- Docker
- gcloud SDK connecté au projet GCP
- Firestore + service account JSON

## Variables
- PORT (par défaut 3000)
- FIREBASE_SERVICE_ACCOUNT_PATH (chemin du service account)
- RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS (optionnel)
- CORS_ORIGINS (CSV)
- STRIPE_SECRET_KEY (optionnel, payments en pause)

## Build local
```bash
npm install
npm run build
PORT=3000 node dist/index.js
```

## Docker local
```bash
docker build -t solaire-api:local .
docker run -p 3000:3000 -e FIREBASE_SERVICE_ACCOUNT_PATH=/app/serviceAccountKey.json solaire-api:local
```

## Cloud Run (via gcloud)
```bash
PROJECT_ID=your-project
gcloud builds submit --tag gcr.io/$PROJECT_ID/solaire-api:latest
gcloud run deploy solaire-api \
  --image gcr.io/$PROJECT_ID/solaire-api:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars FIREBASE_SERVICE_ACCOUNT_PATH=/app/serviceAccountKey.json,CORS_ORIGINS="https://yohand-byte.github.io"
```

## Santé
- `/health`
- `/api/health`
- `/docs` (Swagger UI)

## Smoke
- `curl http://localhost:3000/health`
- `curl http://localhost:3000/api/messages?projectId=smoke`
