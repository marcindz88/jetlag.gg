import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ENDPOINTS } from '../constants/endpoints';

type QueryParam = {
  name: string;
  value: string | number;
};

export type Config = {
  id?: number | string;
  queryParams?: QueryParam[];
};

@Injectable({
  providedIn: 'root',
})
export class EndpointsService {
  getEndpoint(id: keyof typeof ENDPOINTS, config?: Config): string {
    const url = this.getUrlWithReplacedId(ENDPOINTS[id], config);
    return `${environment.protocols.http}${environment.server.apiSubDomain}${environment.server.domain}/api/${url}`;
  }

  getWebSocketEndpoint(): string {
    return `${environment.protocols.ws}${environment.server.wsSubDomain}${environment.server.domain}/ws/`;
  }

  private getUrlWithReplacedId(url: string, config?: Config): string {
    if (config?.id) {
      return `${url.replace('<id>', `${config.id}`)}`;
    }
    return url.replace('/<id>', '');
  }
}
