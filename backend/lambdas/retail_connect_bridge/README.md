# RetailConnectBridge Lambda

The Day 8 and Day 9 progress reports say this function invoked the Amazon Bedrock Agent successfully and that the Connect contact flow was configured with Lex, the bridge, AI response, error prompt, and disconnect blocks.

A reconstructed handler is now available at lambda_function.py. It supports common Lex V2, API Gateway web-chat, and Amazon Connect contact-flow input shapes.

Required environment variables:
- BEDROCK_AGENT_ID
- BEDROCK_AGENT_ALIAS_ID

Configure IAM permission for bedrock:InvokeAgent on the intended agent/alias. Validate the event and response with the actual Lex code hook and Connect flow test events. The original event mapping was lost, so this implementation is not guaranteed to match every historic contact-flow attribute.
