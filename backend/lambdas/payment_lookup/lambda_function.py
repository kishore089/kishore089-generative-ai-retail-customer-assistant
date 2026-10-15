"""Payment lookup. Avoid returning or logging full sensitive payment credentials."""
import json, os
from retail_common import dynamodb_table, find_record, item_to_json, response, parameters, bedrock_agent_response, is_agent_action_event
TABLE_ENV="PAYMENTS_TABLE"; TABLE_DEFAULT="Payments"
KEY_FIELDS=tuple(x.strip() for x in os.getenv("PAYMENT_KEY_FIELDS","PaymentID,PaymentId,paymentId,OrdersID,OrderID,CustomerID").split(",") if x.strip())
def handler(event, context):
    try:
        params=parameters(event); item=find_record(dynamodb_table(TABLE_ENV,TABLE_DEFAULT),params,KEY_FIELDS)
        result={"success":bool(item),"data":item_to_json(item),"message":"Payment record found" if item else "Payment record not found"}
        if is_agent_action_event(event): return bedrock_agent_response(event,json.dumps(result))
        return response(200 if item else 404,result)
    except Exception:
        if is_agent_action_event(event): return bedrock_agent_response(event,json.dumps({"success":False,"message":"Payment lookup failed"}))
        return response(500,{"success":False,"message":"Payment lookup failed"})
lambda_handler=handler
