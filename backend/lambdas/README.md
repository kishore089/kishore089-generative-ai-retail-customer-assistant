# Reconstructed Lambda handlers

Executable Python handlers are now present for the lookup functions, bridge, escalation, analytics, login identity lookup, customer profile/search, order status update, cancellation, and Lex web chat.

## Handlers added
- customer_lookup/lambda_function.py
- product_lookup/lambda_function.py
- order_lookup/lambda_function.py
- inventory_lookup/lambda_function.py
- payment_lookup/lambda_function.py
- return_lookup/lambda_function.py
- support_ticket_lookup/lambda_function.py
- retail_connect_bridge/lambda_function.py
- escalation/lambda_function.py
- ai_analytics/lambda_function.py
- user_login/lambda_function.py
- customer_profile/lambda_function.py
- customer_search/lambda_function.py
- order_status_update/lambda_function.py
- cancel_order/lambda_function.py
- lex_api/lambda_function.py

Shared helpers live in _shared/retail_common.py. Package each handler with this shared module using backend/scripts/package_lambdas.py.

## Critical reconstruction note

These are newly reconstructed implementations based on the architecture, progress reports, and frontend contracts—not recovered copies of the lost original code. The exact original table keys, action-group schemas, analytics source, cancellation rules, authorization model, and Connect handoff behavior were not fully preserved in the available records. Review and test them against your actual DynamoDB schema and deployed configuration before production use.

The architecture also shows an "Other Utility Lambda" but does not identify its actual name or behavior, so no speculative handler is provided for it.
