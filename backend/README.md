# Retail Customer Assistant — Backend

This directory organizes backend source for the existing React/Vite frontend at the repository root. The frontend has not been moved or rewritten.

## Structured Lambda folders

```text
backend/
  lambdas/
    customer_lookup/
    product_lookup/
    order_lookup/
    inventory_lookup/
    payment_lookup/
    return_lookup/
    support_ticket_lookup/
    cancel_order/
    retail_connect_bridge/
    escalation/
    ai_analytics/
    customer_login/
    customer_profile/
    customer_search/
    order_status_update/
    lex_api/
  shared/
  tests/
  deployment/
```

## Important source recovery status

The current repository's main branch did not contain the original Lambda handler source files when inspected. Folder READMEs document evidence and recovery checks; they are not executable replacements. Exact deployed function names/count must be confirmed from AWS Lambda and API Gateway / Bedrock Gateway integrations.

## Known frontend API areas

The frontend expects `/customer`, `/customer-search`, `/products`, `/orders`, `/payments`, `/returns`, `/support`, `/analytics`, and `/lex`. Multiple routes may share one Lambda; a route may also use different methods. Inspect the actual integration mapping before treating each API area as a separate function.

## Safe restoration workflow

1. Export each deployed Lambda's source and configuration.
2. Record runtime, handler, environment variable names, layers, memory, timeout, VPC configuration and IAM role.
3. Save every Bedrock Agent Action Group / Gateway schema.
4. Match API Gateway routes and methods to real integrations.
5. Add tests with sanitized fixtures and mocked AWS clients.
6. Never commit secrets, live environment files, or real customer data.
7. Do not deploy reconstructed handlers over existing functions before contract testing.
