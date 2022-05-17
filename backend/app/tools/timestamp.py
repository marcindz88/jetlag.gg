import datetime
import math


def timestamp_now():
    return math.floor(datetime.datetime.now().timestamp() * 1000)
