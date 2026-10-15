"""Customer profile REST endpoint compatible with the current frontend."""
import json, os
from retail_common import dynamodb_table, find_record, item_to_json, response, parameters
def handler(event, context):
    try:
        params=parameters(event)
        table=dynamodb_table("CUSTOMERS_TABLE","Customers")
        fields=tuple(x.strip() for x in os.getenv("CUSTOMER_KEY_FIELDS","CustomerID,CustomerId,customerId,Email,email").split(",") if x.strip())
        item=find_record(table,params,fields)
        return response(200 if item else 404,{"success":bool(item),"data":item_to_json(item),"customer":item_to_json(item),"message":"Customer found" if item else "Customer not found"})
    except Exception:
        return response(500,{"success":False,"message":"Unable to retrieve customer profile."})
lambda_handler=handler
