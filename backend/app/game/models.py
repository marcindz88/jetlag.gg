from pydantic import BaseModel, conint


class PlayerPositionUpdateRequest(BaseModel):
    bearing: conint(ge=0, lt=360)
    velocity: conint(ge=0)
    timestamp: conint(ge=0)
