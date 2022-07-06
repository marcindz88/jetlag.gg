import enum


class DeathCause(str, enum.Enum):
    RUN_OUT_OF_FUEL = "run_out_of_fuel"
    SPEED_TOO_LOW = "speed_too_low"
    DISCONNECTED = "disconnected"
