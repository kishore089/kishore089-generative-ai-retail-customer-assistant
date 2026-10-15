# Retail AI Contact Center — AWS Architecture

This is the versioned architecture reference for the **Generative AI Retail Customer Assistant**. The diagram is a repository-maintained redraw of the latest architecture image supplied for the project.

![Retail AI Contact Center — AWS Architecture](architecture.svg)

## Architecture layers

### 1. Client layer
- React + Vite web application
- Customer dashboard
- Admin dashboard
- AI Assistant
- Amazon Connect as the voice/contact-center entry point

### 2. Conversation layer
- Amazon Connect contact flow: welcome prompt, Lex V2, bridge, AI response, error prompt, and disconnect
- Amazon Lex V2 bot: RetailShoppingAssistant
- 20 intents: ExpressDelivery, CancelOrder, ExchangePolicy, CustomerProfile, PaymentMethods, ProductSearch, ContactSupport, OrderStatus, ShippingPolicy, ShippingCost, StoreLocation, FallbackIntent, BusinessHours, Offers, DeliveryTime, Exit, ReturnPolicy, Warranty, Greeting, LiveAgent
- RetailConnectBridge Lambda
- Escalation Lambda

### 3. Amazon Bedrock AI layer
- Bedrock Agent (Classic)
- Agent Memory / conversation context
- Agent Action Groups invoking backend functions
- Bedrock Guardrails for content filters, PII, and topics

### 4. Knowledge Base / RAG
- Amazon S3 for retail documents
- Amazon Bedrock Knowledge Base
- Titan Text Embeddings V2
- Amazon S3 Vectors as the vector store

### 5. Retail backend and operational data
- Amazon API Gateway
- Lambda functions for user login, customer, product, inventory, order, payment, return, support, analytics, cancellation, and other utility operations
- Amazon DynamoDB operational data: Users, Customers, Orders, Returns, Payments, SupportTickets, Products, and Inventory

### Optional / future enhancements shown in the supplied diagram
- Amazon Connect Contact Lens
- Amazon CloudWatch
- Amazon Cognito
- AWS IAM
- Amazon SNS / SES

## Flow legend
- **Conversation flow:** the web/voice conversation moves between the customer, Connect, Lex, and the bridge.
- **AI/agent flow:** the bridge invokes the Bedrock Agent; the agent uses memory, action groups, and guardrails.
- **Backend data flow:** Action Groups invoke Lambda functions that access operational records.
- **Knowledge flow:** the agent retrieves documented retail content through the Knowledge Base.
- **Escalation flow:** the contact flow follows the escalation path when configured.
- **Web API flow:** the frontend calls API Gateway routes.

## Important implementation notes
- This diagram represents the intended design, not proof that every service or connection is deployed and working.
- The latest supplied architecture shows Amazon S3 Vectors. Earlier project notes mention OpenSearch Serverless; the newer architecture is the current design reference.
- Agent Classic Action Group schemas, Lambda mappings, API Gateway routes, IAM policies, Cognito authorizers, and Connect transfer behavior must be verified against the actual AWS environment.
- The exact original Lambda source was lost. The code in backend/lambdas/ is reconstructed and must be validated before deployment.
