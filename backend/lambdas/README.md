# Lambda inventory and source recovery

One folder per deployed Lambda, using snake_case folder names. Preserve the deployed function names as metadata in each folder README.

Expected functions to recover:
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

Do not invent DynamoDB primary keys or Bedrock Action Group response schemas. Export the deployed function code/configuration first and document the exact contract.
