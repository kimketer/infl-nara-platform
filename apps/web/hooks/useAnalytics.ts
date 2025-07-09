import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { logger } from '../lib/logger';

interface UseAnalyticsProps {
  userId?: string;
  sessionId?: string;
}

export const useAnalytics = ({ userId, sessionId }: UseAnalyticsProps = {}) => {
  const router = useRouter();

  // 페이지 뷰 추적
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      logger.trackPageView(url, userId);
    };

    // 초기 페이지 로드
    logger.trackPageView(router.asPath, userId);

    // 라우트 변경 감지
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, userId]);

  // 사용자 행동 추적 함수들
  const trackEvent = useCallback((
    action: string, 
    properties?: Record<string, any>
  ) => {
    logger.trackUserAction(action, properties, userId);
  }, [userId]);

  const trackButtonClick = useCallback((
    buttonName: string, 
    page?: string, 
    additionalProps?: Record<string, any>
  ) => {
    trackEvent('button_click', {
      button_name: buttonName,
      page: page || router.asPath,
      ...additionalProps,
    });
  }, [trackEvent, router.asPath]);

  const trackFormSubmission = useCallback((
    formName: string, 
    success: boolean, 
    additionalProps?: Record<string, any>
  ) => {
    trackEvent('form_submission', {
      form_name: formName,
      success,
      page: router.asPath,
      ...additionalProps,
    });
  }, [trackEvent, router.asPath]);

  const trackError = useCallback((
    error: Error, 
    context?: Record<string, any>
  ) => {
    logger.error(`User Error: ${error.message}`, {
      error_name: error.name,
      error_stack: error.stack,
      page: router.asPath,
      ...context,
    }, userId, sessionId);
  }, [userId, sessionId, router.asPath]);

  const trackPerformance = useCallback((
    metric: string, 
    value: number, 
    unit?: string
  ) => {
    trackEvent('performance_metric', {
      metric,
      value,
      unit,
      page: router.asPath,
    });
  }, [trackEvent, router.asPath]);

  return {
    trackEvent,
    trackButtonClick,
    trackFormSubmission,
    trackError,
    trackPerformance,
  };
}; 