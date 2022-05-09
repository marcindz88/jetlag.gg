import dataclasses
import datetime
import enum


class EventType(str, enum.Enum):
    PLAYER_CONNECTED = "player.connected"
    PLAYER_REGISTERED = 'player.registered'
    PLAYER_DISCONNECTED = 'player.disconnected'
    PLAYER_REMOVED = 'player.removed'


EVENTS_EMITTED_BY_SERVER = [
    EventType.PLAYER_CONNECTED,
    EventType.PLAYER_REGISTERED,
    EventType.PLAYER_DISCONNECTED,
    EventType.PLAYER_REMOVED,
]


@dataclasses.dataclass
class Event:
    type: EventType
    data: dict
    created: datetime.datetime = dataclasses.field(default_factory=datetime.datetime.now)
    emitted_by_server: bool = True
