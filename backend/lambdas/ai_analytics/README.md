# AIAnalytics Lambda

A reconstructed handler is available at lambda_function.py. It returns the summary, conversation, resolution, escalation, sentiment, intents, and recentConversations fields expected by src/services/analytics.service.ts.

Required configuration:
- ANALYTICS_TABLE: DynamoDB table containing one item per recorded interaction.
- Records are expected to optionally contain success, resolved, escalated, sentiment, intent, responseTimeMs, durationSeconds, completed, and timestamp fields.

The original analytics table and metric definitions were not preserved. The default ConversationAnalytics table is only a placeholder; configure the actual data source before testing. This handler does not create analytics events, so another component must write them.
