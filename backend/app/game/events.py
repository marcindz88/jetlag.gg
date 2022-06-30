import dataclasses
import enum

from pydantic import ValidationError, BaseModel, validator, conint

from app.game.exceptions import InvalidEventFormat
from app.tools.timestamp import timestamp_now


class EventType(str, enum.Enum):
    PLAYER_LIST = "player.list"
    PLAYER_CONNECTED = "player.connected"
    PLAYER_REGISTERED = 'player.registered'
    PLAYER_DISCONNECTED = 'player.disconnected'
    PLAYER_REMOVED = 'player.removed'
    PLAYER_UPDATED = 'player.updated'
    PLAYER_POSITION_UPDATED = 'player_position.updated'
    PLAYER_POSITION_UPDATE_REQUEST = 'player_position.update_request'
    AIRPORT_LANDING_REQUEST = 'airport.landing_request'
    AIRPORT_DEPARTURE_REQUEST = 'airport.departure_request'
    AIRPORT_SHIPMENT_DISPATCH_REQUEST = 'airport.shipment_dispatch_request'
    AIRPORT_SHIPMENT_DELIVERY_REQUEST = 'airport.shipment_delivery_request'
    AIRPORT_SHIPMENT_DELIVERED = 'airport.shipment_delivered'
    AIRPORT_REFUELING_START_REQUEST = 'airport.refueling_start_request'
    AIRPORT_REFUELING_END_REQUEST = 'airport.refueling_end_request'
    AIRPORT_REFUELING_STOPPED = 'airport.refueling_stopped'
    AIRPORT_UPDATED = 'airport.updated'
    AIRPORT_LIST = 'airport.list'


EVENTS_EMITTED_BY_SERVER = [
    EventType.PLAYER_LIST,
    EventType.PLAYER_CONNECTED,
    EventType.PLAYER_REGISTERED,
    EventType.PLAYER_DISCONNECTED,
    EventType.PLAYER_REMOVED,
    EventType.PLAYER_UPDATED,
    EventType.PLAYER_POSITION_UPDATED,
    EventType.AIRPORT_SHIPMENT_DELIVERED,
    EventType.AIRPORT_REFUELING_STOPPED,
    EventType.AIRPORT_UPDATED,
    EventType.AIRPORT_LIST,
]


@dataclasses.dataclass
class Event:
    type: EventType
    data: dict
    created: int = dataclasses.field(default_factory=timestamp_now)


class EventMessageBody(BaseModel):
    type: EventType
    data: dict
    created: conint(gt=0)

    @validator('type')
    def type_must_be_client_specific(cls, v):
        if v in EVENTS_EMITTED_BY_SERVER:
            raise ValueError('must be client specific')
        return v


def dict_to_event(data: dict):
    try:
        model = EventMessageBody(**data)
        event = Event(**vars(model))
    except ValidationError as e:
        raise InvalidEventFormat from e

    return event
