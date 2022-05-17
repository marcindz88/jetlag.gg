import { LoaderService } from '@shared/services/loader.service';
import { finalize, Observable } from 'rxjs';

export function enableLoader<T>(source$: Observable<T>): Observable<T> {
  LoaderService.addLoader();
  return source$.pipe(finalize(() => LoaderService.endLoader()));
}
