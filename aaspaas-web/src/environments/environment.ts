/**
 * Local development settings.
 * apiUrl must point at the Spring Boot backend (server.port=9090 in
 * application.properties). The backend CORS list already allows
 * http://localhost:4200 (app.cors.allowed-origins).
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:9090/api',
  wsUrl: 'ws://localhost:9090/ws',
  /** How often the customer tracking screen asks for the partner's latest position. */
  trackingPollMs: 8000,
  /** How often a delivery partner's browser pushes its location while on a delivery. */
  locationPushMs: 15000,
};
