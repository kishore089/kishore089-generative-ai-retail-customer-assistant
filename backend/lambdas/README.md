# Lambda inventory and source recovery

This inventory separates explicitly named historical functions from backend API responsibilities whose deployed Lambda boundaries still need verification.

## Explicitly named in project records
- RetailCustomerLookup
- RetailProductLookup
- RetailOrderLookup
- RetailInventoryLookup
- RetailPaymentLookup
- RetailReturnLookup
- RetailSupportLookup
- Retailcancelorder (also referenced as RetailCancelOrderTool)
- RetailConnectBridge
- EscalationLambda
- CustomerLoginTool (gateway/action target; verify whether this is a Lambda and its exact purpose)
- AIAnalytics / analytics Lambda (mentioned in project context; recover exact deployed function name)

## Backend API responsibilities also present in project records/frontend
- Customer profile API (`GET /customer`)
- Admin customer search (`GET /customer-search`)
- Order status update (`PUT /orders/{OrdersID}/status`)
- Lex web-chat API (`POST /lex`)
- Analytics API (`/analytics`)

These responsibilities may be handled by existing shared Lambda functions rather than one Lambda per endpoint. Do not count them as separate deployed functions until verified in AWS API Gateway integrations / Bedrock Gateway.

## Not counted as a Lambda without confirmation
- `RetailKnowledgeBase`: prior records identify this as a Gateway target, but it may represent a Knowledge Base integration rather than a Lambda.
- `RetailCustomerTool`, `RetailOrderTool`, `RetailProductTool`, `RetailInventoryTool`, `RetailPaymentTool`, `RetailReturnTool`, and `SupportTicket`: these are Gateway/Action Group target names; they may map to the explicit lookup Lambdas above rather than separate functions.

Export deployed code/configuration before implementing or deploying replacements.
