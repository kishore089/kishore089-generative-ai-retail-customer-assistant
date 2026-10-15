# User Login / Identity Lookup Lambda

A reconstructed identity helper is available at lambda_function.py. It reads claims from a trusted API Gateway authorizer context and returns minimal user identity fields.

The frontend also integrates Amazon Cognito. This handler does not authenticate passwords and should not replace Cognito sign-in. Verify whether the architecture's User Login Lambda and prior CustomerLoginTool target refer to this same function before wiring it into any API or Agent Action Group.
