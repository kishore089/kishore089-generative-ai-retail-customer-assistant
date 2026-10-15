# CustomerLoginTool / customer login Lambda

**Evidence:** Earlier Bedrock Gateway / Action Group configuration listed a `CustomerLoginTool` target.

Expected responsibility: confirm the exact purpose from the deployed Action Group schema. The frontend separately uses Amazon Cognito for authentication, so do not assume this Lambda should handle or store passwords.

Recovery requirements: inspect the Action Group/OpenAPI schema and deployed handler to determine whether this is identity lookup, login-related customer resolution, or another function. Never store plaintext credentials.
