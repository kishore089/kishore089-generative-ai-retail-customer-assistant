"""Analytics API based on stored interaction events.

The exact historical analytics data source was lost. Configure ANALYTICS_TABLE to
a table containing one item per interaction with the fields documented below.
"""
import os, logging
from decimal import Decimal
from retail_common import dynamodb_table, response, item_to_json
logger=logging.getLogger(); logger.setLevel(os.getenv("LOG_LEVEL","INFO"))
def _num(value):
    try: return float(value or 0)
    except (ValueError,TypeError): return 0
def handler(event, context):
    try:
        table_name=os.getenv("ANALYTICS_TABLE","ConversationAnalytics")
        result=dynamodb_table("ANALYTICS_TABLE",table_name).scan(Limit=int(os.getenv("ANALYTICS_SCAN_LIMIT","1000")))
        rows=result.get("Items",[])
        total=len(rows); success=sum(1 for x in rows if x.get("success") is True); failed=total-success
        resolved=sum(1 for x in rows if x.get("resolved") is True); escalated=sum(1 for x in rows if x.get("escalated") is True)
        times=[_num(x.get("responseTimeMs")) for x in rows if x.get("responseTimeMs") is not None]
        sentiments={"positive":0,"neutral":0,"negative":0}; intents={}
        for x in rows:
            s=str(x.get("sentiment","")).lower()
            if s in sentiments: sentiments[s]+=1
            intent=x.get("intent")
            if intent: intents[str(intent)]=intents.get(str(intent),0)+1
        duration=sum(_num(x.get("durationSeconds")) for x in rows)
        done=sum(1 for x in rows if x.get("completed") is True)
        n=total or 1
        body={"success":True,"summary":{"totalRequests":total,"successfulRequests":success,"failedRequests":failed,"averageResponseTimeMs":sum(times)/len(times) if times else 0},"conversation":{"completedSessions":done,"totalSessionDurationSeconds":duration,"averageHandleTimeSeconds":duration/done if done else 0,"averageHandleTimeMinutes":duration/done/60 if done else 0},"resolution":{"resolvedRequests":resolved,"unresolvedRequests":total-resolved,"resolutionRate":resolved/n*100},"escalation":{"escalatedRequests":escalated,"notEscalatedRequests":total-escalated,"escalationRate":escalated/n*100},"sentiment":{**sentiments,"positivePercentage":sentiments["positive"]/n*100,"neutralPercentage":sentiments["neutral"]/n*100,"negativePercentage":sentiments["negative"]/n*100},"intents":[{"name":k,"count":v} for k,v in sorted(intents.items(),key=lambda kv:kv[1],reverse=True)],"recentConversations":[item_to_json(x) for x in rows[-20:]]}
        return response(200,body)
    except Exception as exc:
        logger.exception("Analytics read failed (%s)",type(exc).__name__)
        return response(500,{"success":False,"message":"Analytics data is unavailable. Configure ANALYTICS_TABLE to the correct interaction table."})
lambda_handler=handler
