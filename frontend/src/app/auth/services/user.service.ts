import { Injectable } from '@angular/core';
import { UserHttpService } from '@auth/services/user-http.service';
import { enableLoader } from '@shared/operators/operators';
import { LoaderService } from '@shared/services/loader.service';
import { BehaviorSubject, Observable, tap } from 'rxjs';

import { User } from '../models/user.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  readonly playerLSKey = 'player';

  user$ = new BehaviorSubject<User | null>(null);

  constructor(private userHttpService: UserHttpService) {
    this.restoreUser();
  }

  createUser(nickname: string): Observable<User> {
    return this.userHttpService.createUser(nickname).pipe(enableLoader, tap(this.setUser.bind(this)));
  }

  setUser(user: User) {
    this.user$.next(user);
    localStorage.setItem(this.playerLSKey, JSON.stringify(user));
    LoaderService.addLoader(); // start additional loader until earth finishes rendering
  }

  restoreUser() {
    const userFromStorage = localStorage.getItem(this.playerLSKey);
    if (userFromStorage) {
      const user = JSON.parse(userFromStorage) as User;
      this.user$.next(user);
      LoaderService.addLoader(); // start additional loader until earth finishes rendering
    }
  }

  resetUser() {
    localStorage.removeItem(this.playerLSKey);
    this.user$.next(null);
  }
}
