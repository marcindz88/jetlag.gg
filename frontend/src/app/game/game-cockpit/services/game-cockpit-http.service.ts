import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserService } from '@auth/services/user.service';
import { EndpointsService } from '@shared/services/endpoints.service';
import { from, Observable } from 'rxjs';

@Injectable()
export class GameCockpitHttpService {
  constructor(
    private httpClient: HttpClient,
    private endpointsService: EndpointsService,
    private userService: UserService
  ) {}

  exitGame(): Observable<Response> {
    // fetch used to keepalive after page unload
    return from(
      fetch(this.endpointsService.getEndpoint('exit'), {
        keepalive: true,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Token: this.userService.user$.value?.token || '',
        },
        body: JSON.stringify({}),
      })
    );
  }
}
