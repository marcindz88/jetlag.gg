import { NgtGLOptions } from '@angular-three/core/lib/types';
import { PCFSoftShadowMap, WebGLShadowMap } from 'three';

export const RENDERER_OPTIONS: NgtGLOptions = {
  physicallyCorrectLights: true,
};
export const SHADOW_OPTIONS: Partial<WebGLShadowMap> = {
  enabled: true,
  type: PCFSoftShadowMap,
};
