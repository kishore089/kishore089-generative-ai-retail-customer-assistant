"""Order cancellation. Confirm authorization and real status rules before deployment."""
import os, logging
from retail_common import dynamodb_table, response, parameters, item_to_json
logger=logging.getLogger(); logger.setLevel(os.getenv("LOG_LEVEL","INFO"))
def handler(event, context):
    try:
        params=parameters(event)
        order_id=params.get("OrdersID") or params.get("OrderID") or params.get("orderId") or (event.get("pathParameters") or {}).get("OrdersID")
        if not order_id: return response(400,{"success":False,"message":"An order ID is required."})
        table=dynamodb_table("ORDERS_TABLE","Ordersai")
        key_field=os.getenv("ORDER_PRIMARY_KEY","OrdersID"); status_field=os.getenv("ORDER_STATUS_FIELD","OrderStatus")
        current=table.get_item(Key={key_field:order_id}).get("Item")
        if not current: return response(404,{"success":False,"message":"Order not found."})
        status=str(current.get(status_field,""))
        if status in {"Shipped","OutForDelivery","Delivered","Cancelled"}:
            return response(409,{"success":False,"message":f"Order cannot be cancelled while status is {status}."})
        table.update_item(Key={key_field:order_id},UpdateExpression="SET #s = :cancelled",ExpressionAttributeNames={"#s":status_field},ExpressionAttributeValues={":cancelled":"Cancelled"})
        current[status_field]="Cancelled"
        return response(200,{"success":True,"message":"Order cancelled.","OrdersID":order_id,"order":item_to_json(current)})
    except Exception as exc:
        logger.exception("Cancel order failed (%s)",type(exc).__name__)
        return response(500,{"success":False,"message":"Order cancellation failed."})
lambda_handler=handler
