import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { User } from '@auth/models/user.types';
import { OtherPlayer } from '@pg/game/models/player.types';
import { EndpointsService } from '@shared/services/endpoints.service';
import { Observable } from 'rxjs';

@Injectable()
export class GameHttpService {
  constructor(private httpClient: HttpClient, private endpointsService: EndpointsService) {}

  join(): Observable<User & OtherPlayer> {
    return this.httpClient.post<User & OtherPlayer>(this.endpointsService.getEndpoint('join'), {});
  }
}
