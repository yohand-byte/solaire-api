# Solaire API - Safe Bootstrap
- Express + TypeScript strict
- createApp() (pas de listen dans les tests)
- Swagger UI: /docs, spec: /openapi.json
- Health: /health
- Security: helmet, cors, JSON body limit
- Docker multi-stage, GitHub Actions test workflow

## Quick Start
```bash
npm install
npm run dev
```

## Tests & Couverture
```bash
npm test -- --coverage
```
Quality gate: global coverage >= 70%.

## Déploiement
Voir DEPLOYMENT.md pour Cloud Run et Docker (port 3000 par défaut).
