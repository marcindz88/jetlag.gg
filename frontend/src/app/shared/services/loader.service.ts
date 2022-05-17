import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  static isLoading$ = new BehaviorSubject(false);

  private static activeLoaders = 0;

  get loading$() {
    return LoaderService.isLoading$;
  }

  static addLoader() {
    this.activeLoaders++;
    this.update();
  }

  static endLoader() {
    if (this.activeLoaders) {
      this.activeLoaders--;
      this.update();
    }
  }

  private static update() {
    this.isLoading$.next(!!this.activeLoaders);
  }
}
