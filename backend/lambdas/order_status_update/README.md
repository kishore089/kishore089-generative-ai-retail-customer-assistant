# Order status update Lambda

**Evidence:** The frontend order-management service calls `PUT /orders/{OrdersID}/status` with `OrdersID` and `OrderStatus`. Earlier project notes describe order Lambda functionality that gets order status/history and creates/updates orders.

Expected responsibility: update an order status according to allowed business transitions.

Recovery requirements: export deployed source and verify exact key schema, allowed transitions, customer/admin authorization, and audit behavior. This may be part of a broader order Lambda rather than a separate deployed function; confirm in AWS before treating it as a distinct function.
