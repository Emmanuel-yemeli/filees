export const environment = {
  production: false,
  // Tout passe par le Gateway :8765
  apiUrl:             'http://localhost:8765/api',
  userApiUrl:         'http://localhost:8765/api',
  complaintsApiUrl:   'http://localhost:8765/api',
  organizationsApiUrl:'http://localhost:8765/api',   // ← via Gateway (était 9095 direct)
  notificationsApiUrl:'http://localhost:8765/api',   // ← via Gateway (était 9090 direct)
  // Services sans gateway (hors périmètre Sprint 2)
  jobOffersApiUrl:    'http://localhost:9090/api',
  invitationsApiUrl:  'http://localhost:9090/api',
  projectsApiUrl:     'http://localhost:9091/api',
  // WebSocket notification — connexion directe (STOMP ne passe pas par HTTP Gateway)
  notificationsWsUrl: 'http://localhost:9090/ws'
};