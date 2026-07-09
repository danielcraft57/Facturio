/** Réexport compat — voir lifecycleNotifications.ts */
export {
  QUOTA_EXCEEDED_EVENT,
  DEMO_BLOCKED_EVENT,
  type QuotaExceededDetail,
  type DemoBlockedDetail,
  isQuotaErrorMessage,
  dispatchQuotaExceededEvent,
  dispatchDemoBlockedEvent,
  wasQuotaToastShown,
  markQuotaToastShown,
} from './lifecycleNotifications'
