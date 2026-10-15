"""Order lookup; historical Day 5 report refers to an Ordersai DynamoDB table."""
import json, os
from retail_common import dynamodb_table, find_record, item_to_json, response, parameters, bedrock_agent_response, is_agent_action_event
TABLE_ENV="ORDERS_TABLE"; TABLE_DEFAULT=os.getenv("ORDERS_TABLE","Ordersai")
KEY_FIELDS=tuple(x.strip() for x in os.getenv("ORDER_KEY_FIELDS","OrdersID,OrderID,OrderId,orderId,TrackingID,TrackingNumber,CustomerID").split(",") if x.strip())
def handler(event, context):
    try:
        params=parameters(event); table=dynamodb_table(TABLE_ENV,TABLE_DEFAULT)
        item=find_record(table,params,KEY_FIELDS)
        result={"success":bool(item),"data":item_to_json(item),"message":"Order found" if item else "Order not found"}
        if is_agent_action_event(event): return bedrock_agent_response(event,json.dumps(result))
        return response(200 if item else 404,result)
    except Exception:
        if is_agent_action_event(event): return bedrock_agent_response(event,json.dumps({"success":False,"message":"Order lookup failed"}))
        return response(500,{"success":False,"message":"Order lookup failed"})
lambda_handler=handler
