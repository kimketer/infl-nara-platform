import * as Sentry from '@sentry/nextjs';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogData {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(data: LogData): string {
    const timestamp = new Date().toISOString();
    const context = data.context ? ` | Context: ${JSON.stringify(data.context)}` : '';
    const user = data.userId ? ` | User: ${data.userId}` : '';
    const session = data.sessionId ? ` | Session: ${data.sessionId}` : '';
    
    return `[${timestamp}] ${data.level.toUpperCase()}: ${data.message}${context}${user}${session}`;
  }

  private sendToSentry(data: LogData) {
    if (data.level === LogLevel.ERROR) {
      Sentry.captureException(new Error(data.message), {
        extra: data.context,
        user: data.userId ? { id: data.userId } : undefined,
        tags: {
          level: data.level,
          sessionId: data.sessionId,
        },
      });
    } else {
      Sentry.addBreadcrumb({
        category: 'app',
        message: data.message,
        level: data.level as any,
        data: data.context,
      });
    }
  }

  private sendToAnalytics(data: LogData) {
    // Google Analytics 4 이벤트 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'app_log', {
        event_category: 'logging',
        event_label: data.level,
        value: data.context,
        custom_parameter_1: data.userId,
        custom_parameter_2: data.sessionId,
      });
    }
  }

  debug(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    const data: LogData = { level: LogLevel.DEBUG, message, context, userId, sessionId };
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(data));
    }
    
    this.sendToSentry(data);
  }

  info(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    const data: LogData = { level: LogLevel.INFO, message, context, userId, sessionId };
    
    if (this.isDevelopment) {
      console.info(this.formatMessage(data));
    }
    
    this.sendToSentry(data);
    this.sendToAnalytics(data);
  }

  warn(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    const data: LogData = { level: LogLevel.WARN, message, context, userId, sessionId };
    
    if (this.isDevelopment) {
      console.warn(this.formatMessage(data));
    }
    
    this.sendToSentry(data);
    this.sendToAnalytics(data);
  }

  error(message: string, context?: Record<string, any>, userId?: string, sessionId?: string) {
    const data: LogData = { level: LogLevel.ERROR, message, context, userId, sessionId };
    
    if (this.isDevelopment) {
      console.error(this.formatMessage(data));
    }
    
    this.sendToSentry(data);
    this.sendToAnalytics(data);
  }

  // 사용자 행동 추적
  trackUserAction(action: string, properties?: Record<string, any>, userId?: string) {
    this.info(`User Action: ${action}`, properties, userId);
    
    // Google Analytics 4 이벤트 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: 'user_action',
        ...properties,
        user_id: userId,
      });
    }
  }

  // 페이지 뷰 추적
  trackPageView(page: string, userId?: string) {
    this.info(`Page View: ${page}`, { page }, userId);
    
    // Google Analytics 4 페이지뷰 전송
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: page,
        user_id: userId,
      });
    }
  }
}

export const logger = new Logger(); 