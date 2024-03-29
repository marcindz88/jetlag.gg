import { Pipe, PipeTransform } from '@angular/core';
import { DeathCauseEnum } from '@pg/game/models/player.types';

@Pipe({ name: 'deathCause' })
export class DeathCausePipe implements PipeTransform {
  transform(
    deathCause: DeathCauseEnum | null | undefined,
    type: 'long' | 'short' | 'message1stperson' | 'message3rdperson' = 'short'
  ): string {
    if (!deathCause) {
      switch (type) {
        case 'message1stperson':
          return 'You died';
        case 'message3rdperson':
          return 'died for unknown reasons';
        default:
          return '';
      }
    }

    switch (type) {
      case 'long':
        switch (deathCause) {
          case DeathCauseEnum.RUN_OUT_OF_FUEL:
            return 'lack of fuel';
          case DeathCauseEnum.SPEED_TOO_LOW:
            return 'to small velocity';
          case DeathCauseEnum.DISCONNECTED:
            return 'lack of connection';
          case DeathCauseEnum.EXITED:
            return 'left the game';
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
          case DeathCauseEnum.EXITED:
            return 'left the game';
        }
        break;
      case 'message1stperson':
        switch (deathCause) {
          case DeathCauseEnum.RUN_OUT_OF_FUEL:
            return 'You run out of fuel!';
          case DeathCauseEnum.SPEED_TOO_LOW:
            return 'Next time better accelerate!';
          case DeathCauseEnum.DISCONNECTED:
            return 'You got disconnected!';
          case DeathCauseEnum.EXITED:
            return 'You left the game';
        }
        break;
      case 'message3rdperson':
        switch (deathCause) {
          case DeathCauseEnum.RUN_OUT_OF_FUEL:
            return 'run out of fuel';
          case DeathCauseEnum.SPEED_TOO_LOW:
            return 'tried to land with no landing gear';
          case DeathCauseEnum.DISCONNECTED:
            return 'got disconnected';
          case DeathCauseEnum.EXITED:
            return 'left the game';
        }
        break;
    }
  }
}
