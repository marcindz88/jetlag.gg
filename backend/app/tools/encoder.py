import json
import datetime
from uuid import UUID


class JSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, datetime.datetime):
            return obj.timestamp()
        return json.JSONEncoder.default(self, obj)


def encode(data: dict) -> dict:
    return json.loads(json.dumps(data, cls=JSONEncoder))
