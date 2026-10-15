# Generative AI Retail Customer Assistant

An AI-powered retail support application combining a React + TypeScript + Vite web experience, customer/admin dashboards, Amazon Lex V2, Amazon Connect, Amazon Bedrock Agents, retrieval-augmented generation (RAG), and serverless retail APIs.

> **Repository status:** The frontend is present. Backend folders are being organized, but the original deployed Lambda handler source has not yet been recovered into Git. See the backend recovery status below before deployment.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the updated AWS architecture and component responsibilities.

### Web and data flow
1. Customers and admins use the React + Vite web application.
2. The frontend calls REST endpoints through Amazon API Gateway.
3. Backend Lambda functions read or update operational records in Amazon DynamoDB.
4. Amazon Cognito provides web-user authentication.

### Voice and AI flow
1. An incoming call enters an Amazon Connect contact flow.
2. Amazon Lex V2, using the RetailShoppingAssistant bot, captures the customer's intent.
3. RetailConnectBridge invokes the Bedrock Agent and returns the answer.
4. The Bedrock Agent uses Agent Memory, Action Groups, and Guardrails as configured.
5. Retail policy documents in Amazon S3 are retrieved through Amazon Bedrock Knowledge Bases, Titan Text Embeddings V2, and Amazon S3 Vectors.
6. EscalationLambda supports the human-agent escalation path.

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
- docs/ — architecture, API contracts, and recovery inventory
- backend/lambdas/ — documented folders for known and expected functions
- backend/shared/ — shared backend code guidance
- backend/tests/ — backend testing guidance
- backend/deployment/ — deployment guidance
- .env.example — frontend environment-variable template

## Frontend setup

Prerequisite: a Node.js version compatible with the Vite version in package.json.

Install dependencies:

    npm install

Copy .env.example to .env.local and provide values for your own environment. Do not commit .env.local or credentials.

Start the development server:

    npm run dev

Run checks:

    npm run lint
    npm run build

Frontend environment variable names:
- VITE_API_BASE_URL — backend API base URL
- VITE_LEX_API_URL — optional explicit Lex chat URL
- VITE_COGNITO_USER_POOL_ID — Cognito User Pool ID
- VITE_COGNITO_CLIENT_ID — Cognito app client ID
- VITE_COGNITO_REGION — Cognito region

Only public frontend configuration belongs in Vite variables. Never put AWS access keys, secret keys, passwords, or server-side credentials in a Vite variable.

## Frontend API areas

The frontend service modules reference /customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. See [docs/frontend-backend-contracts.md](docs/frontend-backend-contracts.md). Verify actual API Gateway methods and integrations against AWS before restoring handlers.

## Backend recovery status

The repository source tree did not contain the original Lambda handler source files when inspected. The folders under backend/lambdas document expected responsibilities; their README files are not replacements for deployed Python handlers.

Before deploying:
1. Export each deployed Lambda source and configuration from AWS.
2. Confirm function name, runtime, handler, environment variable names, IAM role, layers, timeout, and memory.
3. Record API Gateway route-to-Lambda integrations.
4. Export Bedrock Agent Action Group schemas and confirm Lambda targets.
5. Confirm the Lex/Connect event contract for RetailConnectBridge and escalation.
6. Restore source, add sanitized tests, and validate contracts before deployment.

See [docs/lambda-inventory.md](docs/lambda-inventory.md). Do not deploy guessed handlers over working AWS functions.

## Security
- Never commit .env files, AWS credentials, Cognito secrets, API keys, or real customer data.
- Use least-privilege IAM permissions.
- Enforce customer-level authorization in backend handlers; a customer ID supplied by the browser is not proof of identity.
- Avoid logging passwords, tokens, full payment details, or personally identifiable information.
- Keep test fixtures synthetic and sanitized.

## Technology stack

React, TypeScript, Vite, React Router, TanStack Query, Axios, Tailwind CSS, AWS Amplify libraries, Amazon API Gateway, AWS Lambda, Amazon DynamoDB, Amazon Cognito, Amazon Lex V2, Amazon Connect, Amazon Bedrock Agents, Bedrock Guardrails, Amazon Bedrock Knowledge Bases, Amazon S3, Amazon S3 Vectors, and Amazon Titan Text Embeddings V2.

Contact Lens, CloudWatch, IAM, and SNS/SES are shown as optional/future enhancements in the architecture. A service should be considered implemented only when its configuration and source are present and tested.
