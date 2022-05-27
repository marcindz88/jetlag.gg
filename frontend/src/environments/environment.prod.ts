export const environment = <const>{
  production: true,
  name: 'Production',
  server: {
    domain: 'jetlag.gg',
    apiSubDomain: 'api.',
    wsSubDomain: 'api.',
  },
  protocols: { http: 'https://', ws: 'wss://' },
};
