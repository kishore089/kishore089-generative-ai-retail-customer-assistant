# Development workflow

## Frontend
1. Create a feature branch.
2. Install dependencies with npm install.
3. Configure local environment values in an untracked .env.local file.
4. Run npm run lint and npm run build.
5. Test the frontend against a non-production backend before opening a pull request.

## Backend recovery
1. Export deployed Lambda code and configuration before editing.
2. Save the current source in the matching backend/lambdas folder.
3. Record its invocation contract (API Gateway, Bedrock Action Group, Lex/Connect, or other trigger).
4. Add sanitized event fixtures and mocked unit tests.
5. Validate response shapes against the frontend or caller.
6. Deploy to a non-production environment first.

## Repository rules
- Do not commit .env, AWS credentials, tokens, real customer data, or unredacted production events.
- Keep AgentCore/Gateway experiments separate from the Bedrock Agent + Lex/Connect implementation unless the architecture migration is intentional.
- Do not commit generated dependencies such as node_modules or Python virtual environments.
- Explain any environment-variable changes in .env.example without including secret values.
