"""Inventory lookup for retail availability questions."""
import json, os
from retail_common import dynamodb_table, find_record, item_to_json, response, parameters, bedrock_agent_response, is_agent_action_event
TABLE_ENV="INVENTORY_TABLE"; TABLE_DEFAULT="Inventory"
KEY_FIELDS=tuple(x.strip() for x in os.getenv("INVENTORY_KEY_FIELDS","ProductsID,ProductID,ProductId,productId,SKU,sku,InventoryID,ItemID").split(",") if x.strip())
def handler(event, context):
    try:
        params=parameters(event); item=find_record(dynamodb_table(TABLE_ENV,TABLE_DEFAULT),params,KEY_FIELDS)
        result={"success":bool(item),"data":item_to_json(item),"message":"Inventory record found" if item else "Inventory record not found"}
        if is_agent_action_event(event): return bedrock_agent_response(event,json.dumps(result))
        return response(200 if item else 404,result)
    except Exception:
        if is_agent_action_event(event): return bedrock_agent_response(event,json.dumps({"success":False,"message":"Inventory lookup failed"}))
        return response(500,{"success":False,"message":"Inventory lookup failed"})
lambda_handler=handler
