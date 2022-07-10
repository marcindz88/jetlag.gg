export const ROUTES = {
  root: '/',
  login: 'login',
  game: 'game',
};

export const GAME_ROUTES = {
  intro: 'intro',
  cockpit: 'cockpit',
  over: 'over',
};

export const ROUTES_URLS = {
  root: ROUTES.root,
  login: `/${ROUTES.login}`,
  game: `/${ROUTES.game}`,
  game_cockpit: `/${ROUTES.game}/${GAME_ROUTES.cockpit}`,
  game_over: `/${ROUTES.game}/${GAME_ROUTES.over}`,
};
