# Cancel Order Lambda

A reconstructed handler is available at lambda_function.py. It expects an order ID and updates the configured order status field to Cancelled.

Configuration:
- ORDERS_TABLE (defaults to Ordersai based on the Day 5 report)
- ORDER_PRIMARY_KEY (defaults to OrdersID)
- ORDER_STATUS_FIELD (defaults to OrderStatus)

The original order schema, cancellation policy, and authorization rules were lost. The current implementation has basic status checks but must not be deployed publicly until caller authorization, valid status transitions, and conditional writes are verified.
