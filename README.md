# 🖥️ Retail Customer Assistant — Frontend
### React + TypeScript + Vite customer and admin experience

<p align="center">
<img alt="React" src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-3178C6?logo=typescript&logoColor=white">
<img alt="Vite" src="https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white">
</p>

This branch contains the web application for the Generative AI Retail Customer Assistant. It provides customer and admin dashboards, customer profile/search screens, product and order views, payment/return/support pages, and the AI assistant interface.

> The backend source is intentionally excluded from this branch. The integrated project is maintained in the main branch; backend work belongs on the backend branch.

## Features
- Customer and admin dashboards
- Customer profile and admin customer search
- Product browsing and details
- Orders and order-status views
- Payments, returns, and support-ticket views
- AI assistant chat and Lex API integration
- Authentication integration points
- Responsive UI components and shared API service modules

## Technology
- React, TypeScript, Vite
- React Router
- TanStack Query and Axios
- Tailwind CSS / HeroUI components
- AWS Amplify/Cognito integration points

## Run locally

Prerequisites: Node.js compatible with the Vite version in package.json and npm.

~~~bash
npm install
cp .env.example .env.local
npm run dev
~~~

In Windows PowerShell, use Copy-Item .env.example .env.local instead of cp.

Configure the public frontend environment values in .env.local. The current names include VITE_API_BASE_URL, VITE_LEX_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_REGION.

~~~bash
npm run lint
npm run build
~~~

Never store AWS access keys, passwords, or server-side secrets in frontend variables. Only public configuration belongs in Vite environment variables.

## API expectations
Frontend service modules reference /customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. These are expected API routes, not proof that the matching AWS routes are deployed.

## Shared project design
- [AWS architecture diagram](docs/architecture.svg)
- [Architecture notes](docs/architecture.md)
- [Agent Classic master prompt — Product Routing v5.0](docs/agent-classic-master-prompt.md)
- [Frontend/backend contracts](docs/frontend-backend-contracts.md)

## Branches
- main — integrated frontend, backend, and project documentation
- frontend — this frontend-only working branch
- backend — backend-only working branch
