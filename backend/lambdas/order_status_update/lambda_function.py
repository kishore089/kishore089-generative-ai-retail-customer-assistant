"""Update an order status using configurable DynamoDB key and field names."""
import os, logging
from retail_common import dynamodb_table, response, parameters, item_to_json
logger=logging.getLogger(); logger.setLevel(os.getenv("LOG_LEVEL","INFO"))
ALLOWED={"Pending","Confirmed","Processing","Shipped","OutForDelivery","Delivered","Cancelled"}
def handler(event, context):
    try:
        params=parameters(event); order_id=params.get("OrdersID") or params.get("OrderID") or params.get("orderId") or (event.get("pathParameters") or {}).get("OrdersID")
        status=params.get("OrderStatus") or params.get("status")
        if not order_id or not status: return response(400,{"success":False,"message":"OrdersID and OrderStatus are required."})
        if status not in ALLOWED: return response(400,{"success":False,"message":"Unsupported order status."})
        table=dynamodb_table("ORDERS_TABLE","Ordersai")
        key_field=os.getenv("ORDER_PRIMARY_KEY","OrdersID")
        status_field=os.getenv("ORDER_STATUS_FIELD","OrderStatus")
        current=table.get_item(Key={key_field:order_id}).get("Item")
        if not current: return response(404,{"success":False,"message":"Order not found."})
        previous=current.get(status_field)
        # This handler expects the caller's authorizer/role policy to enforce access.
        table.update_item(Key={key_field:order_id},UpdateExpression="SET #status = :status",ExpressionAttributeNames={"#status":status_field},ExpressionAttributeValues={":status":status})
        updated=dict(current); updated[status_field]=status
        return response(200,{"success":True,"message":"Order status updated.","OrdersID":order_id,"previousStatus":previous,"newStatus":status,"order":item_to_json(updated)})
    except Exception as exc:
        logger.exception("Order status update failed (%s)",type(exc).__name__)
        return response(500,{"success":False,"message":"Order status update failed."})
lambda_handler=handler
