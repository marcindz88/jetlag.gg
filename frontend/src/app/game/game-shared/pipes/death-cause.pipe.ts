import { Pipe, PipeTransform } from '@angular/core';
import { DeathCauseEnum } from '@pg/game/models/player.types';

@Pipe({ name: 'deathCause' })
export class DeathCausePipe implements PipeTransform {
  transform(deathCause: DeathCauseEnum, type: 'long' | 'short' = 'short'): string {
    switch (type) {
      case 'long':
        switch (deathCause) {
          case DeathCauseEnum.RUN_OUT_OF_FUEL:
            return 'lack of fuel';
          case DeathCauseEnum.SPEED_TOO_LOW:
            return 'to small velocity';
          case DeathCauseEnum.DISCONNECTED:
            return 'lack of connection';
        }
        break;
      case 'short':
        switch (deathCause) {
          case DeathCauseEnum.RUN_OUT_OF_FUEL:
            return 'no fuel';
          case DeathCauseEnum.SPEED_TOO_LOW:
            return 'low speed';
          case DeathCauseEnum.DISCONNECTED:
            return 'disconnected';
        }
    }
  }
}
