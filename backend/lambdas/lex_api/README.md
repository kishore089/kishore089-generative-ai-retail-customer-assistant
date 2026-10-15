# Lex API Lambda

**Evidence:** The frontend sends `POST /lex` with action, message, customerId, sessionId, and channel fields. The architecture routes web chat through Lex and a bridge Lambda to the Bedrock Agent.

Expected responsibility: handle the frontend's Lex chat API request and return the response envelope expected by the frontend.

Recovery requirements: confirm whether this is a dedicated Lambda, an API Gateway integration to another function, or a proxy. Do not confuse it with RetailConnectBridge without checking deployed integrations.
