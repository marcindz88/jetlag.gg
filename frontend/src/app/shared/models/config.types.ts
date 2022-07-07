const defaultServerConfig = {
  MAX_PLAYERS: 16,
  PLAYER_TIME_TO_CONNECT: 5000, // 5 seconds
  MAX_SHIPMENTS_IN_GAME: 40,
  MIN_VELOCITY: 0,
  MAX_VELOCITY: 2000000, // 2M km/h
  AIRPORT_MAXIMUM_DISTANCE_TO_LAND: 500, // 500km
  EARTH_RADIUS: 6371.0,
  FLIGHT_ALTITUDE: 200.0,
  FUEL_TANK_SIZE: 50000, // liters
  REFUELING_RATE: 3000, // liters per second
};

const defaultClientConfig = {
  MIN_STEP_VELOCITY: 500,
  MAX_STEP_VELOCITY: 50000,
  STEP_BEARING: 4,
  EARTH_RADIUS_SCALED: 40,
  NUMBER_OF_CLOSE_AIRPORTS: 6,
  CAMERA_DEFAULT_ZOOM: 1 / 3,
  CAMERA_FOLLOWING_HEIGHT_MULTIPLIER: 1.2,
  CAMERA_ZOOM_SPEED: 0.3,
  CAMERA_ROTATE_SPEED: 0.3,
  CAMERA_NUMBER_OF_MODES: 3,
  CAMERA_MIN_ALTITUDE: 320,
  CAMERA_MAX_ALTITUDE: 3200,
  LOW_FUEL_THRESHOLD: 20, // %
  LOW_VELOCITY_THRESHOLD: 150000,
  PLANE_POSITION_REFRESH_TIME: 1000,
  MY_PLANE_POSITION_REFRESH_TIME: 250,
  LEADERBOARD_TABLE_LENGTH: 20,
};

export const getDependentClientConfig = (CONFIG: BaseConfigType) => {
  const MAP_SCALE = CONFIG.EARTH_RADIUS_SCALED / CONFIG.EARTH_RADIUS;
  const FLIGHT_ALTITUDE_SCALED = CONFIG.FLIGHT_ALTITUDE * MAP_SCALE;
  const FLIGHT_MOVING_RADIUS = CONFIG.EARTH_RADIUS_SCALED + CONFIG.FLIGHT_ALTITUDE * MAP_SCALE;
  return {
    MAP_SCALE,
    FLIGHT_ALTITUDE_SCALED,
    FLIGHT_MOVING_RADIUS,
    FLIGHT_MOVING_CIRCUMFERENCE: FLIGHT_MOVING_RADIUS * 2 * Math.PI,
    AIRPORT_MAXIMUM_DISTANCE_TO_LAND_SCALED: CONFIG.AIRPORT_MAXIMUM_DISTANCE_TO_LAND * MAP_SCALE,
    AIRPORT_ALTITUDE_SCALED: 70 * MAP_SCALE,
    CAMERA_MIN_DISTANCE: CONFIG.EARTH_RADIUS_SCALED + CONFIG.CAMERA_MIN_ALTITUDE * MAP_SCALE,
    CAMERA_MAX_DISTANCE: CONFIG.EARTH_RADIUS_SCALED + CONFIG.CAMERA_MAX_ALTITUDE * MAP_SCALE,
    REFUELLING_FULL_TIME: (CONFIG.FUEL_TANK_SIZE / CONFIG.REFUELING_RATE) * 1000,
  };
};

const defaultBaseConfig: BaseConfigType = {
  ...defaultClientConfig,
  ...defaultServerConfig,
};

const dependentClientConfig = getDependentClientConfig(defaultBaseConfig);

export const defaultConfig: ConfigType = {
  ...defaultBaseConfig,
  ...dependentClientConfig,
};

export type ServerConfigType = typeof defaultServerConfig;
export type ClientConfigType = typeof defaultClientConfig;
export type DependentClientConfigType = typeof dependentClientConfig;

export type BaseConfigType = ServerConfigType & ClientConfigType;

export type ConfigType = BaseConfigType & DependentClientConfigType;
