# Retail Customer Assistant — Backend

This directory contains reconstructed Python handlers for the existing React/Vite frontend and Bedrock Agent / Lex / Connect architecture.

## Handler inventory

- customer_lookup
- product_lookup
- order_lookup
- inventory_lookup
- payment_lookup
- return_lookup
- support_ticket_lookup
- retail_connect_bridge
- escalation
- ai_analytics
- user_login
- customer_profile
- customer_search
- order_status_update
- cancel_order
- lex_api

Shared helpers are in lambdas/_shared/retail_common.py. Build individual deployment ZIPs from the repository root with:

    python backend/scripts/package_lambdas.py

The script packages a handler with the shared helper; it does not deploy to AWS.

## Evidence and assumptions

The Day 5 report records RetailOrderLookup using the Ordersai DynamoDB table. Day 6/7 reports confirm seven lookup categories: order, customer, product, inventory, payment, return, and support ticket. Day 8/9 reports confirm RetailConnectBridge invokes the Bedrock Agent and EscalationLambda was tested. The latest architecture image is the current design reference for the S3 Vectors Knowledge Base and the 20 Lex intents.

The exact original Lambda source was lost. These handlers are reconstructions, not recovered copies. Some folders may represent separate API responsibilities rather than separate deployed functions. Confirm the actual deployed function count and all integrations before deployment.

## Known frontend API areas

/customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. See ../docs/frontend-backend-contracts.md.

## Required validation before deployment

1. Verify actual DynamoDB key schemas and use primary keys or GSIs instead of fallback scans.
2. Confirm the Bedrock Action Group schema and response envelope for each lookup function.
3. Confirm API Gateway route/method mappings, CORS, and Cognito/JWT authorization.
4. Verify order ownership, allowed status transitions, and cancellation rules.
5. Test Lex V2 and Amazon Connect events against the deployed bot/flow.
6. Configure the correct analytics source and validate its metric definitions.
7. Test in a non-production environment before deployment.
