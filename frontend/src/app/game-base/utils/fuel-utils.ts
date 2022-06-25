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
