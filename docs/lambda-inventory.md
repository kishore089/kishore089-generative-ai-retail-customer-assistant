# Lambda inventory and recovery plan

This inventory consolidates names and responsibilities found in the updated architecture, project progress reports, and frontend service code. It is not a verified export of the current AWS Lambda inventory.

## Functions explicitly documented in progress reports

| Function | Evidence / responsibility |
|---|---|
| RetailOrderLookup | Created and tested with the Ordersai DynamoDB table in the Day 5 report. |
| RetailCustomerLookup | Customer lookup Action Group. |
| RetailProductLookup | Product lookup Action Group. |
| RetailInventoryLookup | Inventory lookup Action Group. |
| RetailPaymentLookup | Payment lookup Action Group. |
| RetailReturnLookup | Return lookup Action Group. |
| RetailSupportLookup | Support-ticket lookup Action Group. |
| RetailConnectBridge | Invokes the Bedrock Agent; validated in Day 8 and Day 9 reports. |
| EscalationLambda | Created and tested in the Day 9 report. |

The Day 6/7 reports document the seven lookup functions. The architecture image additionally shows a User Login Lambda and Other Utility Lambda.

## Additional functions or API responsibilities referenced elsewhere

| Name / responsibility | Evidence | What must be verified |
|---|---|---|
| AIAnalytics | Frontend has src/services/analytics.service.ts calling /analytics; project context refers to an analytics Lambda. | Exact deployed function name, data source, metric definitions, and API integration. |
| User Login / CustomerLoginTool | Architecture shows User Login Lambda; prior Gateway context mentions CustomerLoginTool. | Whether these are the same deployed function and its identity-resolution contract. |
| Customer Profile | Frontend GET /customer. | Whether it is RetailCustomerLookup or a separate API Lambda. |
| Customer Search | Frontend GET /customer-search; prior context says the endpoint was implemented. | Exact Lambda integration and authorization. |
| Order Status Update | Frontend PUT /orders/{OrdersID}/status. | Separate function or operation in a broader order Lambda. |
| Website Lex API | Frontend POST /lex. | Separate handler or route to another function. |
| Cancel Order | Architecture intent and prior project context mention cancellation; previous notes refer to Retailcancelorder / RetailCancelOrderTool. | Exact deployed name, key schema, status transitions, and authorization. |
| Other Utility Lambda | Shown in the architecture image. | Actual name and responsibility. |

## Gateway / Action Group names that are not automatically separate Lambdas

Names such as RetailKnowledgeBase, RetailCustomerTool, RetailOrderTool, RetailProductTool, RetailInventoryTool, RetailPaymentTool, RetailReturnTool, and SupportTicket may be target names or schemas rather than distinct Lambda functions. Confirm actual targets before creating duplicate source folders.

## Source status

The original handler source files were not present in the GitHub repository tree when reviewed. The backend/lambdas/*/README.md files document intended responsibility and recovery checks only. They are not executable source code.

## Recovery checklist

For each deployed function, capture:
- Exact Lambda function name and ARN (avoid committing account-specific identifiers unnecessarily).
- Runtime, handler, architecture, memory, timeout, layers, and VPC settings.
- Environment variable names; store secret values only in a secret manager, never Git.
- IAM execution role and required permissions.
- API Gateway route/method or Bedrock Action Group schema that invokes it.
- Sanitized request event and response contract, including errors.
- Data store names and primary-key schema.
- Unit tests and deployment procedure.

Retrieve source from Lambda export, prior branches/commits, or local backups. Do not replace a working deployed Lambda with guessed code.
