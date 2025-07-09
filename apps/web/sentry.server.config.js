import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Ignore specific errors
  beforeSend(event, hint) {
    // Ignore health check errors
    if (event.request?.url?.includes('/health')) {
      return null;
    }
    return event;
  },
}); 