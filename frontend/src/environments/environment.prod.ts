export const environment = <const>{
  production: true,
  name: 'Production',
  server: {
    domain: 'api.jetlag.gg',
    apiSubDomain: '',
    wsSubDomain: '',
  },
  protocols: { http: 'https://', ws: 'wss://' },
};
