/**
 * Production settings. Replace the host with your real API domain and add it to
 * app.cors.allowed-origins in the backend. (Only used if you add a
 * fileReplacements entry for the production configuration in angular.json.)
 */
export const environment = {
  production: true,
  apiUrl: 'https://api.your-domain.com/api',
  wsUrl: 'wss://api.your-domain.com/ws',
  trackingPollMs: 8000,
  locationPushMs: 15000,
};
