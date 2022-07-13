import { PlaneExtendedPosition, PlanePosition } from '@pg/game/models/player.types';
import { CONFIG } from '@shared/services/config.service';

export const getUpdatedTankLevel = (
  currentTimeStamp: number,
  timestampOfLastLevel: number,
  oldTankLevel: number,
  fuelConsumption: number
): number => {
  const timeDifferenceInHours = (currentTimeStamp - timestampOfLastLevel) / 3_600_000;
  let newTankLevel = oldTankLevel - timeDifferenceInHours * fuelConsumption;

  if (newTankLevel <= 0) {
    newTankLevel = 0;
  }
  return newTankLevel;
};

const getTankLevelPercentage = (tankLevel: number, fullTankCapacity: number) => {
  return (tankLevel / fullTankCapacity) * 100;
};

export const isTankLevelLow = (tanklevel: number, fullTankCapacity: number = CONFIG.FUEL_TANK_SIZE) => {
  const tankLevelPercentage = getTankLevelPercentage(tanklevel, fullTankCapacity);
  return tankLevelPercentage > 0 && tankLevelPercentage < CONFIG.LOW_FUEL_THRESHOLD;
};

export const getPositionWithUpdatedFuel = (
  position: PlanePosition | PlaneExtendedPosition,
  currentTimestamp: number,
  positionUpdate?: PlanePosition
): PlaneExtendedPosition => {
  positionUpdate = positionUpdate || position;

  return {
    ...position,
    tank_level: getUpdatedTankLevel(
      currentTimestamp,
      positionUpdate.timestamp,
      positionUpdate.tank_level,
      positionUpdate.fuel_consumption
    ),
    fuel_consumption: positionUpdate.fuel_consumption,
    fuel_efficiency: positionUpdate.velocity / positionUpdate.fuel_consumption,
    timestamp: currentTimestamp,
  };
};
