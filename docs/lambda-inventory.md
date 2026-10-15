# Lambda inventory and recovery plan

This inventory combines the updated architecture image, project progress reports, frontend API references, and prior project context. It is not an export of deployed AWS Lambda configuration. See [reconstruction verification](reconstruction-verification.md) for evidence levels and unresolved assumptions.

## Confirmed in progress reports

| Function/category | Evidence |
|---|---|
| RetailOrderLookup | Day 5 report: created and tested against Ordersai; OrderLookup Action Group created. |
| RetailCustomerLookup | Day 6/7 reports: customer lookup Action Group tested. |
| RetailProductLookup | Day 6/7 reports: product lookup Action Group tested. |
| RetailInventoryLookup | Day 6/7 reports: inventory lookup Action Group tested; Day 4 describes stock/item lookup. |
| RetailPaymentLookup | Day 6/7 reports: payment lookup Action Group tested. |
| RetailReturnLookup | Day 6/7 reports: return lookup Action Group tested. |
| RetailSupportLookup | Day 6/7 reports: support-ticket lookup Action Group tested. |
| RetailConnectBridge | Day 8/9 reports: invokes Bedrock Agent and returns AI response. |
| EscalationLambda | Day 9 report: created and tested; full live transfer behavior is not specified. |

The Day 5 report lists Customers, Products, Orders, Inventory, Payments, Returns, and SupportTickets as created DynamoDB tables. It separately says RetailOrderLookup used Ordersai. Do not silently assume Ordersai and Orders are the same table.

## Responsibilities also referenced in the latest architecture/frontend

| Function or responsibility | Evidence | Status |
|---|---|---|
| User Login Lambda | Latest architecture image | Function name/contract not recovered |
| AIAnalytics | Frontend /analytics service and prior context | Data source/formulas unknown |
| Other Utility Lambda | Latest architecture image | Name/behavior unspecified |
| Customer Profile | Frontend GET /customer | Could share Customer Lookup Lambda |
| Customer Search | Frontend GET /customer-search | Prior context says endpoint implemented; current integration unknown |
| Order Status Update | Frontend PUT /orders/{OrdersID}/status | Could be an operation in an order handler |
| Website Lex Chat API | Frontend POST /lex | May be a separate handler or route to an existing bridge |
| Cancel Order | Latest architecture includes CancelOrder intent; prior context refers to Retailcancelorder / RetailCancelOrderTool | Exact deployed name/schema unknown |

## Not automatically separate Lambda functions

Gateway/Action Group labels such as RetailKnowledgeBase, RetailCustomerTool, RetailOrderTool, RetailProductTool, RetailInventoryTool, RetailPaymentTool, RetailReturnTool, and SupportTicket may be tool or schema names. Confirm their actual targets before creating duplicate functions.

## Reconstructed code

The repository contains new handlers under backend/lambdas. These are based on the evidence above, not original recovered source. Validate table keys, event formats, action-group schemas, authorization, and business rules before deployment.
