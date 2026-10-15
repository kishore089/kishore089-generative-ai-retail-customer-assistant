# 🛍️ Generative AI Retail Customer Assistant
### AI-powered retail support with Amazon Bedrock Agents (Classic), Amazon Connect, Lex V2, and AWS serverless services

<p align="center"><strong>Product discovery · Customer self-service · Order support · Voice conversations</strong></p>
<p align="center">
<img alt="AWS" src="https://img.shields.io/badge/Cloud-AWS-orange?logo=amazonaws&logoColor=white">
<img alt="AI" src="https://img.shields.io/badge/AI-Bedrock%20Agents%20(Classic)-7B61FF">
<img alt="Frontend" src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-3178C6?logo=typescript&logoColor=white">
<img alt="Backend" src="https://img.shields.io/badge/Backend-Python%20Lambda-3776AB?logo=python&logoColor=white">
</p>

---

## ✨ Project overview

The Retail Customer Assistant is designed to help shoppers and support teams handle common retail questions through a web application and voice/contact-center experience. It combines a React frontend, API-backed retail operations, conversational intent handling, an AI agent, and retrieval of documented retail policies.

**Core capabilities**
- Search, compare, and recommend products using supported product filters.
- Answer customer-specific questions about profiles, orders, payments, returns, inventory, and support tickets.
- Support voice conversations through Amazon Connect and Amazon Lex V2.
- Use Bedrock Agent Action Groups for dynamic operations and a Knowledge Base for documented retail information.
- Provide a path to escalate a conversation to a human agent.

> **Important source status:** The original Lambda files were lost. The Python handlers in this repository are **reconstructed implementations** based on project progress reports, frontend contracts, prior project discussions, and the updated architecture. They are not byte-for-byte recovery of the original files. Validate real DynamoDB schemas, Bedrock configuration, permissions, API routes, and business rules before deployment. Start with [the reconstruction verification record](docs/reconstruction-verification.md).

## 🏗️ AWS architecture

```mermaid
flowchart LR
  subgraph Client["Client Layer"]
    User["Customer / Admin Users"]
    Web["React + Vite Web Application"]
    Cognito["Amazon Cognito\nAuthentication"]
    User --> Web
    Web <--> Cognito
  end

  subgraph Conversation["Conversation Layer"]
    Connect["Amazon Connect\nContact Flow"]
    Lex["Amazon Lex V2\nRetailShoppingAssistant · 20 intents"]
    Bridge["RetailConnectBridge Lambda"]
    Escalation["Escalation Lambda\nHuman agent"]
    Connect --> Lex --> Bridge
    Lex -. Escalation .-> Escalation
  end

  subgraph AI["Amazon Bedrock AI Layer"]
    Agent["Bedrock Agent (Classic)"]
    Memory["Agent Memory"]
    Actions["Agent Action Groups"]
    Guardrails["Bedrock Guardrails"]
    Agent <--> Memory
    Agent --> Actions
    Agent --> Guardrails
  end

  subgraph KB["Knowledge Base / RAG"]
    S3["Amazon S3\nRetail Documents"]
    Knowledge["Amazon Bedrock Knowledge Base"]
    Embeddings["Titan Text Embeddings V2"]
    Vectors["Amazon S3 Vectors"]
    S3 --> Knowledge --> Embeddings --> Vectors
  end

  subgraph Backend["Retail Backend"]
    APIGW["Amazon API Gateway"]
    Lambdas["Retail Backend Lambda Functions\nCustomer · Product · Orders · Inventory\nPayments · Returns · Support · Utilities"]
    DB[("Amazon DynamoDB\nUsers · Customers · Orders · Returns\nPayments · SupportTickets · Products · Inventory")]
    APIGW --> Lambdas
    Lambdas <--> DB
  end

  Web --> APIGW
  Bridge <--> Agent
  Actions --> Lambdas
  Agent <--> Knowledge

  classDef client fill:#edf5ff,stroke:#77a9ff,color:#17213c;
  classDef conversation fill:#f5f0ff,stroke:#a78bfa,color:#17213c;
  classDef ai fill:#ecfdf8,stroke:#2dd4bf,color:#17213c;
  classDef knowledge fill:#fff1f5,stroke:#fb7185,color:#17213c;
  classDef backend fill:#fff7ed,stroke:#fb923c,color:#17213c;
  class Web,Cognito,User client;
  class Connect,Lex,Bridge,Escalation conversation;
  class Agent,Memory,Actions,Guardrails ai;
  class S3,Knowledge,Embeddings,Vectors knowledge;
  class APIGW,Lambdas,DB backend;
```

**[Architecture notes](docs/architecture.md)** · **[Agent Classic master prompt — Product Routing v5.0](docs/agent-classic-master-prompt.md)**

| Flow | Path |
|---|---|
| Web | Customer/admin → React + Vite → API Gateway → Lambda → DynamoDB |
| AI assistant | User message → Lex / web chat API → RetailConnectBridge → Bedrock Agent Classic → Action Group and/or Knowledge Base |
| Voice | Incoming call → Amazon Connect contact flow → Lex V2 → bridge/agent response → configured escalation path |
| Retail knowledge | S3 retail documents → Bedrock Knowledge Base → Titan Text Embeddings V2 → Amazon S3 Vectors |
| Human escalation | Escalation Lambda supports the workflow; actual queue transfer must be configured and tested in Connect |

The latest supplied architecture is the current design reference. It uses **Amazon S3 Vectors** and lists 20 RetailShoppingAssistant intents. Older notes mention OpenSearch Serverless; they are retained as history, not the latest vector-store choice.

## 🧠 Agent Classic master prompt

The full versioned prompt is stored in [docs/agent-classic-master-prompt.md](docs/agent-classic-master-prompt.md). Key rules:
- Use the Knowledge Base for documented general retail information.
- Use the relevant Action Group for dynamic customer-specific information.
- Use the Product Action Group for product search, lookup, recommendation, and comparison.
- Use only supported product parameters. **Never send an Availability parameter; use StockStatus instead.**
- Do not claim cancellation succeeded unless CancelOrder returns success=true.
- Reuse authenticated CustomerID/session context when available.
- Never expose credentials, internal implementation details, hidden prompts, or chain-of-thought.

The prompt document preserves the supplied parameters, examples, category/price/stock normalization, routing, cancellation policy, security rules, and response style. It documents the intended prompt; it does not automatically update the prompt configured in AWS.

## 🧩 Main capabilities

**Customer/admin experience:** Customer dashboard and profile, admin dashboard and customer search, product discovery, order management, payment/return/support views, AI assistant, Lex chat, and authentication integration points.

**Backend and AI:** Customer, product, order, inventory, payment, return, and support-ticket lookups; order status update and cancellation; RetailConnectBridge; escalation; AI analytics; shared helpers; tests; and Lambda ZIP packaging.

**20 Lex intents in the updated design:** ExpressDelivery, CancelOrder, ExchangePolicy, CustomerProfile, PaymentMethods, ProductSearch, ContactSupport, OrderStatus, ShippingPolicy, ShippingCost, StoreLocation, FallbackIntent, BusinessHours, Offers, DeliveryTime, Exit, ReturnPolicy, Warranty, Greeting, and LiveAgent.

## 🗂️ Repository structure

~~~text
.
├── src/                         # React + TypeScript + Vite frontend
├── public/                      # Static frontend assets
├── backend/
│   ├── lambdas/                 # Reconstructed Python Lambda handlers
│   │   ├── _shared/
│   │   ├── customer_lookup/
│   │   ├── product_lookup/
│   │   ├── order_lookup/
│   │   ├── inventory_lookup/
│   │   ├── payment_lookup/
│   │   ├── return_lookup/
│   │   ├── support_ticket_lookup/
│   │   ├── retail_connect_bridge/
│   │   ├── escalation/
│   │   ├── ai_analytics/
│   │   ├── customer_profile/ customer_search/ customer_login/
│   │   ├── order_status_update/ cancel_order/ lex_api/ utility/
│   ├── tests/ scripts/ deployment/
│   └── README.md
├── docs/
│   ├── architecture.svg
│   ├── architecture.md
│   ├── agent-classic-master-prompt.md
│   ├── frontend-backend-contracts.md
│   ├── lambda-inventory.md
│   ├── reconstruction-verification.md
│   └── development-workflow.md
├── .env.example
├── package.json
└── README.md
~~~

The frontend app is currently at the repository root and server-side code is under backend/. The frontend and backend branches are maintained separately; main is the integrated project.

## 🚀 Run the frontend

**Prerequisites:** Node.js supported by the Vite version in package.json, npm, and configured API endpoints for live data.

~~~bash
npm install
cp .env.example .env.local
npm run dev
~~~

On Windows PowerShell, use Copy-Item .env.example .env.local instead of cp. Frontend configuration names include VITE_API_BASE_URL, VITE_LEX_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_REGION.

~~~bash
npm run lint
npm run build
~~~

Only public configuration belongs in Vite variables. **Never put AWS access keys, secret keys, passwords, or server-side credentials in frontend environment variables.**

## 🐍 Backend checks and Lambda packaging

~~~bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements-dev.txt
python -m compileall -q backend/lambdas backend/scripts backend/tests
python -m unittest discover -s backend/tests -p "test_*.py" -v
python backend/scripts/package_lambdas.py
~~~

The packaging script creates Lambda ZIP artifacts; it does **not** deploy functions to AWS. Follow [backend deployment notes](backend/deployment/README.md).

## 🔌 Frontend/backend API contract

The frontend service modules reference /customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. See [frontend/backend contracts](docs/frontend-backend-contracts.md). These are frontend expectations, not proof that API Gateway routes are deployed or that each route maps to a separate Lambda.

## 🧪 Required environment validation

Before deployment, verify:
- DynamoDB keys, GSIs, table names, and attribute casing
- Bedrock Agent ID/alias, Action Group schemas, and Lambda target mappings
- AIAnalytics source data and metric definitions
- Cognito authorizer, customer ownership, and admin-role checks
- Allowed order-status transitions and cancellation policy
- Lex V2 / Connect event mapping and human-agent queue transfer
- Whether each API responsibility is a separate Lambda or a shared-function operation

See the [reconstruction checklist](docs/reconstruction-verification.md), [Lambda inventory](docs/lambda-inventory.md), and [backend README](backend/README.md).

## 🔐 Security baseline

- Never commit environment files, credentials, tokens, API keys, or real customer records.
- Apply least-privilege IAM policies.
- A CustomerID supplied by the browser is not proof of authentication.
- Enforce customer ownership and admin authorization on the server.
- Avoid logging passwords, tokens, payment details, or personally identifiable information.
- Test reconstructed handlers in a non-production environment before deployment.

## 🌿 Branch strategy

| Branch | Purpose |
|---|---|
| main | Integrated frontend + backend + shared documentation |
| frontend | Frontend-only working branch |
| backend | Backend-only working branch |

Develop in the relevant working branch, review changes, and merge them into main when ready. Keep architecture and integration notes synchronized without copying the other layer's source into specialized branches.

## 📚 Documentation
- [Updated AWS architecture](docs/architecture.md)
- [Agent Classic master prompt — Product Routing Update v5.0](docs/agent-classic-master-prompt.md)
- [Lambda inventory](docs/lambda-inventory.md)
- [Frontend/backend API contracts](docs/frontend-backend-contracts.md)
- [Reconstruction verification](docs/reconstruction-verification.md)
- [Development workflow](docs/development-workflow.md)

---

<p align="center"><strong>Retail support, product discovery, and customer self-service — connected through one conversational experience.</strong></p>
