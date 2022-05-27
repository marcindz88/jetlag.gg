import { environment as environmentProd } from './environment.prod';

export const environment = <const>{
  ...environmentProd,
  production: false,
  name: 'Remote',
};
