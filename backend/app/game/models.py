from pydantic import BaseModel, confloat, conint


class PlayerPositionUpdateRequest(BaseModel):
    bearing: confloat(ge=0, lt=360)
    velocity: conint(ge=0)
    timestamp: conint(ge=0)
