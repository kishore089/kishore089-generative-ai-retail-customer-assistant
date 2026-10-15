# Lambda inventory

This directory separates function names explicitly documented in project reports from backend API responsibilities that still need verification against AWS.

## Explicitly named in project records
- RetailOrderLookup
- RetailCustomerLookup
- RetailProductLookup
- RetailInventoryLookup
- RetailPaymentLookup
- RetailReturnLookup
- RetailSupportLookup
- RetailConnectBridge
- EscalationLambda
- Retailcancelorder / RetailCancelOrderTool (exact deployed name must be verified)

The updated architecture also shows User Login Lambda and Other Utility Lambda. The project context mentions AIAnalytics and CustomerLoginTool; verify their exact deployed names and whether CustomerLoginTool is the same as User Login Lambda.

## Additional API responsibilities referenced by the frontend
- Customer profile: GET /customer
- Admin customer search: GET /customer-search
- Order status update: PUT /orders/{OrdersID}/status
- Website Lex chat: POST /lex
- Analytics: GET /analytics

These may be implemented by existing Lambda functions rather than separate functions. Do not create duplicates until the API Gateway integration mapping is checked.

## Gateway/Action Group targets are not necessarily Lambda names
RetailKnowledgeBase, RetailCustomerTool, RetailOrderTool, RetailProductTool, RetailInventoryTool, RetailPaymentTool, RetailReturnTool, and SupportTicket may be target/schema names. Confirm the real integration target before adding a new function.

The original handler source is not currently restored in this repository. See ../../docs/lambda-inventory.md for the recovery checklist.
