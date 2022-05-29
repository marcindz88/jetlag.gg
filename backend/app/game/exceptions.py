class PlayerLimitExceeded(Exception):
    pass


class PlayerNotFound(Exception):
    pass


class PlayerAlreadyConnected(Exception):
    pass


class PlayerInvalidNickname(Exception):
    pass


class ChangingPastPosition(Exception):
    pass


class ChangingFuturePosition(Exception):
    pass


class InvalidEventFormat(Exception):
    pass


class AirportFull(Exception):
    pass


class TooFarToLand(Exception):
    pass


class InvalidAirport(Exception):
    pass


class CantFlyWhenGrounded(Exception):
    pass


class ShipmentNotFound(Exception):
    pass


class ShipmentOperationWhenFlying(Exception):
    pass


class ShipmentExpired(Exception):
    pass


class ShipmentDestinationInvalid(Exception):
    pass


class InvalidOperation(Exception):
    pass


class InvalidVelocity(Exception):
    pass
