# Generative AI Retail Customer Assistant

An AI-powered retail support application combining a React + TypeScript + Vite web experience, customer/admin dashboards, Amazon Lex V2, Amazon Connect, Amazon Bedrock Agents, retrieval-augmented generation (RAG), and serverless retail APIs.

> **Important source status:** The original Lambda source was lost locally and in AWS. This repository now contains reconstructed Python handlers based on the available project progress reports, frontend contracts, prior project discussions, and the latest architecture diagram. They are not byte-for-byte recovery of the original code. Review [the reconstruction verification notes](docs/reconstruction-verification.md) before deployment.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the updated AWS architecture and component responsibilities. The latest supplied architecture image is treated as the current design reference: Amazon S3 retail documents, Bedrock Knowledge Base, Titan Text Embeddings V2, and Amazon S3 Vectors. Earlier progress reports mention OpenSearch Serverless, but the later architecture image supersedes that for the current design.

### Web and data flow
1. Customers and admins use the React + Vite web application.
2. The frontend calls REST endpoints through Amazon API Gateway.
3. Backend Lambda functions read or update operational records in Amazon DynamoDB.
4. Amazon Cognito is the intended web-user authentication integration.

### Voice and AI flow
1. An incoming call enters an Amazon Connect contact flow.
2. Amazon Lex V2, using the RetailShoppingAssistant bot, captures the customer's intent.
3. RetailConnectBridge invokes the Bedrock Agent and returns the answer.
4. The Bedrock Agent uses Agent Memory, Action Groups, and Guardrails as configured.
5. Retail policy documents in Amazon S3 are retrieved through Amazon Bedrock Knowledge Bases, Titan Text Embeddings V2, and Amazon S3 Vectors.
6. EscalationLambda supports the human-agent escalation path. Actual live transfer must be configured in the Connect flow.

## Capabilities represented in the project
- Customer and admin dashboards
- Customer profile lookup and admin customer search
- Product and inventory lookup
- Order lookup and order-status management
- Payment, return, and support-ticket lookup
- AI assistant via the Lex web-chat API
- Retail policy and FAQ retrieval using RAG
- Voice support through Amazon Connect and Lex V2
- Bedrock Agent Action Groups, conversational memory, and Guardrails
- Human-agent escalation
- AI/contact-center analytics
- Cognito authentication integration

## Repository layout

- src/ — React + TypeScript + Vite frontend
- public/ — static frontend assets
- docs/ — architecture, API contracts, reconstruction verification, and Lambda inventory
- backend/lambdas/ — reconstructed Python handlers and shared helpers
- backend/tests/ — backend tests
- backend/scripts/ — Lambda ZIP packaging helper
- backend/deployment/ — deployment guidance
- .env.example — frontend environment-variable template

## Frontend setup

Prerequisite: a Node.js version compatible with the Vite version in package.json.

    npm install

Copy .env.example to .env.local and provide values for your own environment. Do not commit .env.local or credentials.

    npm run dev
    npm run lint
    npm run build

Frontend environment variable names include VITE_API_BASE_URL, VITE_LEX_API_URL, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_REGION. Only public frontend configuration belongs in Vite variables. Never put AWS access keys, secret keys, passwords, or server-side credentials in a Vite variable.

## Frontend API areas

The frontend service modules reference /customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. See [docs/frontend-backend-contracts.md](docs/frontend-backend-contracts.md). These routes document frontend expectations, not proof that API Gateway integrations are deployed.

## Lambda reconstruction and validation

The handlers are reconstructed implementations. We verified their stated responsibilities against the available project reports and current frontend contracts, but some original implementation details were not preserved:
- DynamoDB primary keys, sort keys, GSIs, and exact attribute names
- Exact Bedrock Action Group schemas and target mappings
- AIAnalytics source table and metric definitions
- Cognito authorizer and role/ownership rules
- Order cancellation policy and allowed status transitions
- Exact Lex/Connect event mapping and human-agent transfer behavior

Read [docs/reconstruction-verification.md](docs/reconstruction-verification.md), [docs/lambda-inventory.md](docs/lambda-inventory.md), and [docs/frontend-backend-contracts.md](docs/frontend-backend-contracts.md). Do not deploy to production until the checks listed there pass.

## Security
- Never commit .env files, AWS credentials, Cognito secrets, API keys, or real customer data.
- Use least-privilege IAM permissions.
- Enforce customer-level authorization in backend handlers; a customer ID supplied by the browser is not proof of identity.
- Avoid logging passwords, tokens, full payment details, or personally identifiable information.
- Keep test fixtures synthetic and sanitized.

## Technology stack

React, TypeScript, Vite, React Router, TanStack Query, Axios, Tailwind CSS, AWS Amplify libraries, Amazon API Gateway, AWS Lambda, Amazon DynamoDB, Amazon Cognito, Amazon Lex V2, Amazon Connect, Amazon Bedrock Agents, Bedrock Guardrails, Amazon Bedrock Knowledge Bases, Amazon S3, Amazon S3 Vectors, and Amazon Titan Text Embeddings V2.

Contact Lens, CloudWatch, IAM, and SNS/SES are shown as optional/future enhancements in the latest architecture. A service should be considered implemented only when its configuration and source are present and tested.
