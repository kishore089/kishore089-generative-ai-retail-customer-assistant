# Frontend/backend API contracts

This page records what can be established from current frontend service code. It does not claim every route is deployed correctly.

| Route | Method | Request / purpose | Frontend source |
|---|---|---|---|
| /customer | GET | customerId or email query parameter; profile lookup | src/services/customers/customerService.ts |
| /customer-search | GET | optional customerId, email, phone | src/services/customerSearch.service.ts |
| /orders/{OrdersID}/status | PUT | JSON body { OrdersID, OrderStatus } | src/services/orderManagement.service.ts |
| /lex | POST | { action: "chat", message, customerId, sessionId, channel: "web" } | src/services/lex.service.ts |
| /analytics | GET | summary, conversation stats, resolution/escalation rates, sentiment, intents, recent conversations | src/services/analytics.service.ts |
| /products | API use | product lookup | src/services/product.service.ts |
| /orders | API use | order lookup | src/services/orders.service.ts |
| /payments | API use | payment data | src/services/payments.service.ts |
| /returns | API use | return data | src/services/returns.service.ts |
| /support | API use | support data | src/services/support.service.ts |

## Contract details

### Customer profile
The frontend expects a success envelope with customer data for ID lookup. Email lookup accepts customer or data in the response. Check deployed field names and authorization behavior.

### Customer search
The frontend parses a bare array or common envelopes such as { success, data }. The UI can send ID, email, and phone, but the deployed endpoint may support fewer fields; verify before changing the frontend.

### Order status update
The frontend sends a PUT to /orders/{OrdersID}/status with OrdersID and OrderStatus. Status values currently represented in the frontend are Pending, Confirmed, Processing, Shipped, OutForDelivery, Delivered, and Cancelled. Backend rules must validate allowed transitions and authorization.

### Lex chat
The frontend sends action="chat", message, customerId, sessionId, and channel="web". The response type allows success, message, messages, intent, sessionState, and execution timing fields. Match the API response to the frontend parser.

### Analytics
The analytics service expects request counts, average response time, conversation statistics, resolution/escalation rates, sentiment counts, intent counts, and recent conversation records. The backend must define metric calculations and data sources.

## Validation checklist

- Confirm API Gateway route + method + integration for every row.
- Confirm CORS includes the deployed frontend origin.
- Confirm Cognito/JWT authorization requirements and role-based access.
- Test success, empty, not-found, invalid-input, forbidden, and service-failure responses.
- Never rely on customer IDs supplied by the browser alone for authorization.
- Keep field naming consistent (for example customerId vs CustomerID, and OrdersID vs orderId).
