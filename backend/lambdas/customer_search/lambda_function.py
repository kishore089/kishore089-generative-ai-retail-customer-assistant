"""Admin customer search API. Production use should prefer indexed queries."""
import os
from boto3.dynamodb.conditions import Attr
from retail_common import dynamodb_table, item_to_json, response, parameters
def handler(event, context):
    try:
        params=parameters(event)
        fields=[(k,v) for k,v in (("CustomerID",params.get("customerId")),("Email",params.get("email")),("Phone",params.get("phone"))) if v]
        if not fields: return response(200,{"success":True,"data":[]})
        table=dynamodb_table("CUSTOMERS_TABLE","Customers")
        # Field aliases are configurable because the original schema was lost.
        aliases={"CustomerID":os.getenv("CUSTOMER_ID_FIELD","CustomerID"),"Email":os.getenv("CUSTOMER_EMAIL_FIELD","Email"),"Phone":os.getenv("CUSTOMER_PHONE_FIELD","Phone")}
        filter_expr=None
        for logical,value in fields:
            clause=Attr(aliases[logical]).eq(value)
            filter_expr=clause if filter_expr is None else filter_expr & clause
        result=table.scan(FilterExpression=filter_expr,Limit=int(os.getenv("CUSTOMER_SEARCH_SCAN_LIMIT","100")))
        rows=[item_to_json(x) for x in result.get("Items",[])]
        return response(200,{"success":True,"data":rows,"count":len(rows)})
    except Exception:
        return response(500,{"success":False,"message":"Customer search failed."})
lambda_handler=handler
