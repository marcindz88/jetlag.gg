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
    PLAYER_POSITION_UPDATED = 'player_position.updated'
    PLAYER_POSITION_UPDATE_REQUEST = 'player_position.update_request'
    AIRPORT_LANDING_REQUEST = 'airport.landing_request'
    AIRPORT_PLANE_LANDED = 'airport.plane_landed'
    # AIRPORT_PLANE_LANDING_DECLINED = 'airport.plane_landing_declined'
    AIRPORT_LIST = 'airport.list'

EVENTS_EMITTED_BY_SERVER = [
    EventType.PLAYER_LIST,
    EventType.PLAYER_CONNECTED,
    EventType.PLAYER_REGISTERED,
    EventType.PLAYER_DISCONNECTED,
    EventType.PLAYER_REMOVED,
    EventType.PLAYER_POSITION_UPDATED,
    EventType.AIRPORT_PLANE_LANDED,
    # EventType.AIRPORT_PLANE_LANDING_DECLINED,
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
