import uuid

from pydantic import BaseModel, conint, confloat


class PlayerPositionUpdateRequest(BaseModel):
    bearing: confloat(ge=0, lt=360)
    velocity: conint(ge=0)
    timestamp: conint(ge=0)


class AirportLandingRequest(BaseModel):
    id: uuid.UUID


class AirportRequest(BaseModel):
    id: uuid.UUID


class ShipmentRequest(BaseModel):
    id: uuid.UUID
