import { Injectable } from '@angular/core';
import { UserService } from '@auth/services/user.service';
import { AirportsService } from '@pg/game/services/airports.service';
import { GameWebsocketService } from '@pg/game/services/game-websocket.service';
import { PlayersService } from '@pg/game/services/players.service';

@Injectable()
export class MainGameService {
  constructor(
    private userService: UserService,
    private mainWebsocketService: GameWebsocketService,
    private playersService: PlayersService,
    private airportService: AirportsService
  ) {}

  startGame(playerId: string, playerToken: string) {
    this.playersService.setPlayersUpdateHandler(playerId);
    this.airportService.setAirportsUpdateHandler();
    this.mainWebsocketService.setupGameWebsocket(playerToken);
  }

  endGame(): void {
    this.mainWebsocketService.closeGameWebsocket();
    this.airportService.resetAll();
    this.playersService.resetAll();
  }
}
