import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EndpointsService } from '@shared/services/endpoints.service';
import { Observable } from 'rxjs';

import { User } from '../models/user.types';

@Injectable()
export class UserHttpService {
  constructor(private httpClient: HttpClient, private endpointsService: EndpointsService) {}

  createUser(nickname: string): Observable<User> {
    return this.httpClient.post<User>(this.endpointsService.getEndpoint('players'), { nickname });
  }
}
