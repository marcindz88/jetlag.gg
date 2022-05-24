import { AirPortsMap, NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { NUMBER_OF_CLOSE_AIRPORTS } from '@pg/game-base/constants/game.constants';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';
import { calculateDistanceBetweenPoints } from '@pg/game-base/utils/geo-utils';

export const determineAirportsInProximity = (
  airports: AirPortsMap,
  point: GeoLocationPoint,
  amount = NUMBER_OF_CLOSE_AIRPORTS
): NearAirportsList => {
  const newAirportList: NearAirportsList = [];
  airports.forEach(airport => {
    const distance = calculateDistanceBetweenPoints(airport.coordinates, point);
    newAirportList.push({ distance, airport });
  });

  return newAirportList.sort((a, b) => a.distance - b.distance).slice(0, amount);
};
