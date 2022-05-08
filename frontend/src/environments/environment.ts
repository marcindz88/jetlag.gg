export const environment = <const>{
  production: false,
  name: 'Local',
  server: {
    domain: 'localhost:9999',
    apiSubDomain: '',
    wsSubDomain: 'ws.',
  },
  protocols: { http: 'http://', ws: 'ws://' },
};
