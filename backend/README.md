# Retail Customer Assistant — Backend

This directory is being restored as a structured home for AWS Lambda source code and backend deployment assets. The repository's existing React/Vite frontend remains at the repository root for now; it is not moved or rewritten by this backend addition.

## Planned structure

```text
backend/
  README.md
  lambdas/
    customer_lookup/
    product_lookup/
    order_lookup/
    inventory_lookup/
    payment_lookup/
    return_lookup/
    support_ticket_lookup/
    retail_connect_bridge/
    escalation/
    cancel_order/
  shared/
  tests/
  deployment/
```

## Source-of-truth warning

The original deployed Lambda source files were not found in the repository's current main branch during this recovery. Function names and responsibilities are documented in the project's README and progress reports, but those records do not prove exact handler code, table key schemas, API Gateway routes, or Bedrock Action Group contracts.

Do not deploy reconstructed examples over existing AWS functions until the deployed configuration and code contracts have been compared.

## Restoration checklist

1. Recover exact source from AWS Lambda function exports, prior Git history/branches, local backups, or deployment artifacts where available.
2. Inventory deployed function names, runtime versions, handlers, environment variable names, layers, timeout/memory, VPC settings, and IAM roles.
3. Capture each Bedrock Agent Action Group schema and each API Gateway route/event format.
4. Restore one function at a time and add a README and requirements file beside each handler.
5. Add unit tests with sanitized test events and mocked AWS clients.
6. Add deployment templates only after the actual resource configuration is known.
7. Keep secrets and live customer data out of Git. Commit only placeholder values in `.env.example`.

## Known Lambda responsibilities

- Customer, product, order, inventory, payment, return and support-ticket lookups
- RetailConnectBridge: Amazon Lex / Amazon Connect conversation to Amazon Bedrock Agent
- Escalation: handoff to customer support
- Cancel order: guarded order cancellation workflow

The existing frontend expects REST endpoints including `/customer`, `/customer-search`, `/products`, `/orders`, `/payments`, `/returns`, `/support`, and `/lex`. These names are frontend expectations, not confirmation that deployed API Gateway routes use the same integration.
