import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConfigType, defaultConfig, getDependentClientConfig, ServerConfigType } from '@shared/models/config.types';
import { enableLoader } from '@shared/operators/operators';
import { EndpointsService } from '@shared/services/endpoints.service';
import { Observable } from 'rxjs';

export const CONFIG: ConfigType = defaultConfig;

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  constructor(private httpClient: HttpClient, private endpointsService: EndpointsService) {}

  fetchAndSetConfig() {
    this.getConfig().subscribe(this.updateConfig);
  }

  private updateConfig(config: ServerConfigType) {
    Object.entries(config).forEach(([key, value]) => {
      CONFIG[key as keyof ConfigType] = value;
    });
    CONFIG.MAP_SCALE = CONFIG.EARTH_RADIUS_SCALED / CONFIG.EARTH_RADIUS;
    const dependentConfig = getDependentClientConfig(CONFIG);
    Object.entries(dependentConfig).forEach(([key, value]) => {
      CONFIG[key as keyof ConfigType] = value;
    });
  }

  private getConfig(): Observable<ServerConfigType> {
    return this.httpClient.get<ServerConfigType>(this.endpointsService.getEndpoint('config')).pipe(enableLoader);
  }
}
