# Retail Customer Assistant — Backend

This directory organizes backend source for the existing React/Vite frontend at the repository root. The frontend has not been moved or rewritten.

## Structure

- lambdas/ — one folder per confirmed or expected Lambda responsibility
- shared/ — shared backend helpers (add after source recovery)
- tests/ — sanitized unit and contract tests
- deployment/ — deployment templates and instructions
- requirements-dev.txt — Python test/development dependencies

## Lambda folders currently documented

- customer_lookup
- product_lookup
- order_lookup
- inventory_lookup
- payment_lookup
- return_lookup
- support_ticket_lookup
- retail_connect_bridge
- escalation
- cancel_order
- user_login
- ai_analytics
- customer_profile
- customer_search
- order_status_update
- lex_api
- utility

Some folders represent backend API responsibilities, not yet verified as separate deployed Lambda functions. For example, Customer Profile may share a function with Customer Lookup, and the order status operation may be part of a broader order Lambda. The architecture image also shows Other Utility Lambda without specifying its deployed name.

## Source recovery status

The current repository did not contain the original Lambda handler source files when inspected. Folder READMEs document responsibilities and recovery steps; they are not executable replacements. Confirm exact names and function count from AWS Lambda and API Gateway / Bedrock Agent integrations.

## Known frontend API areas

The frontend expects /customer, /customer-search, /products, /orders, /orders/{OrdersID}/status, /payments, /returns, /support, /analytics, and /lex. Multiple routes may share one Lambda, and a route may have different methods. Inspect actual API Gateway integrations before deciding the final function inventory.

## Safe restoration workflow

1. Export each deployed Lambda source and configuration.
2. Record runtime, handler, environment variable names, layers, memory, timeout, VPC configuration, and IAM role.
3. Save every Bedrock Agent Action Group schema and confirm its Lambda target.
4. Match API Gateway routes and methods to actual integrations.
5. Restore source, add tests with sanitized fixtures, and validate response contracts.
6. Never commit secrets, live environment files, or real customer data.
7. Do not deploy reconstructed handlers over existing functions before contract testing.

See ../docs/lambda-inventory.md and ../docs/frontend-backend-contracts.md.
