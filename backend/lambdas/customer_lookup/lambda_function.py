"""Customer lookup for Bedrock Agent Action Groups and API Gateway."""
import json
import os
from retail_common import dynamodb_table, find_record, item_to_json, response, parameters, bedrock_agent_response, is_agent_action_event

TABLE_ENV = "CUSTOMERS_TABLE"
TABLE_DEFAULT = "Customers"
KEY_FIELDS = tuple(x.strip() for x in os.getenv("CUSTOMER_KEY_FIELDS", "CustomerID,CustomerId,customerId,Email,email").split(",") if x.strip())

def handler(event, context):
    try:
        params = parameters(event)
        table = dynamodb_table(TABLE_ENV, TABLE_DEFAULT)
        item = find_record(table, params, KEY_FIELDS)
        result = {"success": bool(item), "data": item_to_json(item), "message": "Customer found" if item else "Customer not found"}
        if is_agent_action_event(event):
            return bedrock_agent_response(event, json.dumps(result))
        return response(200 if item else 404, result)
    except Exception:
        if is_agent_action_event(event):
            return bedrock_agent_response(event, json.dumps({"success": False, "message": "Customer lookup failed"}))
        return response(500, {"success": False, "message": "Customer lookup failed"})
lambda_handler = handler
