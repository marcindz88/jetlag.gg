import { AirPortsMap, NearAirportsList } from '@pg/game-base/airports/models/airport.types';
import { NUMBER_OF_CLOSE_AIRPORTS } from '@pg/game-base/constants/game.constants';
import { GeoLocationPoint } from '@pg/game-base/models/game.types';

export const determineAirportsInProximity = (
  airports: AirPortsMap,
  point: GeoLocationPoint,
  amount = NUMBER_OF_CLOSE_AIRPORTS
): NearAirportsList => {
  return Array.from(airports.values())
    .map(airport => airport.updateDistance(point))
    .sort((a, b) => a.distance - b.distance)
    .map((airport, index) => airport.updateIsClosest(index === 0))
    .slice(0, amount);
};
