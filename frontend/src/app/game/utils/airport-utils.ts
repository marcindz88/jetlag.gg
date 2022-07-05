import { AirPortsMap, NearAirportsList } from '@pg/game/models/airport.types';
import { GeoLocationPoint } from '@pg/game/models/game.types';
import { CONFIG } from '@shared/services/config.service';

export const determineAirportsInProximity = (
  airports: AirPortsMap,
  point: GeoLocationPoint,
  amount = CONFIG.NUMBER_OF_CLOSE_AIRPORTS
): NearAirportsList => {
  return Array.from(airports.values())
    .map(airport => airport.updateDistance(point))
    .sort((a, b) => a.distance - b.distance)
    .map((airport, index) => airport.updateIsClosest(index === 0))
    .slice(0, amount);
};
