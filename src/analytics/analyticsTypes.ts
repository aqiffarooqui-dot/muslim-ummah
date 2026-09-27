export type AnalyticsEvent = {
  name: string;
  userId?: string;
  timestamp: string;
  platform: 'android' | 'ios' | 'web';
  metadata?: Record<
    string,
    string | number | boolean | null
  >;
};
