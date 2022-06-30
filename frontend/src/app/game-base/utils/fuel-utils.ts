import { CONFIG } from '@shared/services/config.service';

export const updateTankLevel = (
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
