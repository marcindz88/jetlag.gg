import datetime
import math


def timestamp_now():
    # millisecond precision
    return math.floor(datetime.datetime.now().timestamp() * 1000)
