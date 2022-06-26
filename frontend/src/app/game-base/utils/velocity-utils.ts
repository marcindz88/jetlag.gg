import { CONFIG } from '@shared/services/config.service';

const determineVelocityChange = (velocity: number, accelerate: boolean) => {
  if (
    (accelerate && velocity < CONFIG.LOW_VELOCITY_THRESHOLD) ||
    (!accelerate && velocity <= CONFIG.LOW_VELOCITY_THRESHOLD)
  ) {
    return 10000;
  }

  return 50000;
};

export const determineNewVelocity = (velocity: number, accelerate: boolean) => {
  if (velocity === CONFIG.MIN_VELOCITY && !accelerate) {
    return velocity;
  }
  if (velocity === CONFIG.MAX_VELOCITY && accelerate) {
    return velocity;
  }

  const velocityChange = determineVelocityChange(velocity, accelerate) * (accelerate ? 1 : -1);

  let newVelocity = Math.min(velocity + velocityChange, CONFIG.MAX_VELOCITY);
  newVelocity = Math.max(newVelocity, CONFIG.MIN_VELOCITY);

  return newVelocity;
};

export const isLowVelocity = (velocity: number) => {
  return velocity <= CONFIG.LOW_VELOCITY_THRESHOLD;
};

// timeDelta in s
export const determineDisplacement = (velocity: number, timeDelta: number) => {
  return (velocity / 3600) * CONFIG.MAP_SCALE * timeDelta;
};
