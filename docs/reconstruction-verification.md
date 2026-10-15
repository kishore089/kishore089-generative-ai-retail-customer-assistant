# Lambda reconstruction — verification record

**Purpose:** Preserve the most reliable details from the project's progress reports, frontend source, prior project discussions, and the latest architecture image. This document distinguishes confirmed historical facts from reconstructed assumptions.

## Source precedence

1. **Latest user-supplied architecture image (Retail AI Contact Center — AWS Architecture, Updated):** current architecture reference. It shows React + Vite, Amazon API Gateway, Amazon Connect, Lex V2, RetailConnectBridge, Escalation Lambda, Bedrock Agent/Memory/Action Groups/Guardrails, S3 retail documents, Bedrock Knowledge Base, Titan Text Embeddings V2, S3 Vectors, and DynamoDB operational data. It lists 20 Lex intents and shows Contact Lens, CloudWatch, Cognito, IAM, SNS/SES as optional/future enhancements.
2. **Day 8 report:** RetailConnectBridge was created/tested and successfully invoked the Bedrock Agent.
3. **Day 9 report:** retry/exception handling was implemented for the Action Group Lambdas; EscalationLambda was created/tested; RetailConnectBridge returned AI responses; Connect flow included Welcome Prompt, Lex, Bridge Lambda, AI Response Prompt, Error Prompt, and Disconnect.
4. **Day 6 and Day 7 reports:** seven lookup categories were configured and tested with Bedrock Agent Action Groups: Order, Customer, Product, Inventory, Payment, Return, and Support Ticket.
5. **Day 5 report:** DynamoDB tables were created for Customers, Products, Orders, Inventory, Payments, Returns, and SupportTickets. The RetailOrderLookup Lambda used a table named Ordersai. Sample retail data was inserted and order lookup tested.
6. **Day 4 report:** Order Lambda was described as reading order status/history and creating/updating orders; Inventory Lambda checked stock and item details.
7. **Current frontend source:** references /customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. It expects the request/response shapes recorded in frontend-backend-contracts.md.
8. **Earlier Day 3 report:** the first Lex bot had seven intents, but the latest architecture image supersedes that initial intent list and shows 20 current intents.

## Confirmed historical function responsibilities

| Function/category | What the records support | Confidence |
|---|---|---|
| RetailOrderLookup | Reads order records; Day 5 explicitly mentions Ordersai; tested with Bedrock Action Group | High |
| RetailCustomerLookup | Customer lookup Action Group | High for responsibility; key schema unknown |
| RetailProductLookup | Product lookup Action Group | High for responsibility; key schema unknown |
| RetailInventoryLookup | Inventory/stock lookup Action Group | High for responsibility; key schema unknown |
| RetailPaymentLookup | Payment lookup Action Group | High for responsibility; schema unknown |
| RetailReturnLookup | Return lookup Action Group | High for responsibility; schema unknown |
| RetailSupportLookup | Support ticket lookup Action Group | High for responsibility; schema unknown |
| RetailConnectBridge | Invokes Bedrock Agent; validated in Day 8/9 reports | High for responsibility; exact event contract unknown |
| EscalationLambda | Created/tested in Day 9; supports escalation workflow | High for request handling; actual live queue/transfer mechanism unknown |
| User Login Lambda / CustomerLoginTool | Login Lambda shown in latest architecture; CustomerLoginTool name appears in prior Gateway context | Medium/low; exact identity and role are not proven to be the same function |
| AIAnalytics | Current frontend calls /analytics and project context references analytics Lambda | Medium; data source and formulas unknown |
| Other Utility Lambda | Shown in latest architecture image | Low; exact name and behavior unknown |
| Customer profile/search, order status update, web Lex API, cancellation | Frontend or prior context identifies these responsibilities | High that the responsibilities exist; separate Lambda boundaries/names not confirmed |

## Current reconstructed implementation status

The repository contains reconstructed handlers for lookup categories, RetailConnectBridge, EscalationLambda, AIAnalytics, User Login identity lookup, Customer Profile, Customer Search, Order Status Update, Cancel Order, and Lex Chat API.

These are new implementations based on the evidence above. They are **not recovered original files**. Do not describe them as identical to the former working handlers.

## Assumptions that still require verification

- DynamoDB table names, partition/sort keys, secondary indexes, and attribute casing. Ordersai is the only specifically reported table name tied to a Lambda; the report separately lists a table called Orders.
- Whether Customer Profile shares RetailCustomerLookup and whether order update/cancel are separate functions or operations of a shared order handler.
- Bedrock Action Group invocation style (function details vs OpenAPI schema), exact parameters, messageVersion, and response format.
- Bedrock Agent ID/alias and required IAM permissions for RetailConnectBridge.
- Lex bot ID, alias, locale, whether the bridge is invoked as a fulfillment hook or via the Connect flow, and exact Connect event/response attributes.
- Actual human-agent transfer implementation; a Lambda response alone does not perform a Connect transfer.
- Analytics table/source, event-writing path, fields, time windows, and formulas.
- Cognito authorizer context, customer ownership checks, admin role checks, and allowed order status transitions.
- Exact deployed function names and count.

## Corrections made during this verification pass

- Updated project and backend READMEs to state that handlers are reconstructed, not recovered originals.
- Made the latest architecture image the current source of truth for S3 Vectors. Historical Day 6 documentation mentions OpenSearch Serverless; the later updated diagram shows S3 Vectors, so the current documentation follows the latest diagram.
- Extended shared request parsing to include Bedrock OpenAPI Action Group request-body properties and API Gateway path parameters.
- Configured standard AWS SDK retries in the shared DynamoDB helper.
- Preserved explicit warnings about fallback scans, unknown schemas, authorization, and Connect handoff behavior.

## Acceptance checklist

- [ ] Python syntax check passes for all handlers.
- [ ] Unit tests pass with mocked AWS clients.
- [ ] Each handler is tested with a sanitized real-shaped event from its caller.
- [ ] DynamoDB keys and indexes match the real table definitions.
- [ ] Bedrock Action Group schemas and responses match the configured Agent.
- [ ] API Gateway routes, CORS, Cognito/JWT authorizers, and role/ownership checks are verified.
- [ ] Cancellation and order-status transitions are validated.
- [ ] Lex/Connect bridge and human-agent escalation are tested end-to-end in a non-production environment.
- [ ] AIAnalytics metrics are validated against a defined source of truth.
