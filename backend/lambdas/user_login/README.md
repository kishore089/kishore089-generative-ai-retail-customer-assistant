# User Login Lambda

The updated architecture image shows a User Login Lambda. Earlier project context also mentions a CustomerLoginTool target, but it is not confirmed whether these are the same deployed function.

The frontend has Cognito authentication modules under src/services/auth/ and src/config/amplify.ts. Do not implement password validation or store passwords in this Lambda unless the deployed design explicitly requires a secure Cognito-supported flow.

Recovery: export the deployed handler and verify its responsibility, event contract, identity-provider integration, authorization, and response fields. Never commit tokens, secrets, or real user data.
