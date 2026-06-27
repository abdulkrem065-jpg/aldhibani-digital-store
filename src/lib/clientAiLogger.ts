/**
 * clientAiLogger.ts
 * Integrates real-time React error capture, Supabase connection monitoring, and automatic
 * reporting to our centralized AI backend debugging engine.
 */

let isReporting = false;

export function setupClientAISystem() {
  if (typeof window === 'undefined') return;

  const originalConsoleError = window.console.error;

  window.console.error = function (...args: any[]) {
    // 1. Log to the normal console so standard browser debugging works
    originalConsoleError.apply(window.console, args);

    if (isReporting) return;

    // Convert args to a string/details
    const msg = args.map(arg => {
      if (arg instanceof Error) return arg.stack || arg.message;
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    }).join(' ');

    // Prevent network logging loops and benign dev server HMR/WS connection attempts
    if (
      msg.includes('/api/errors/report') || 
      msg.includes('Failed to fetch') || 
      msg.includes('Load failed') ||
      msg.includes('websocket') ||
      msg.includes('HMR') ||
      msg.includes('[vite]')
    ) {
      return;
    }

    isReporting = true;

    // Cast error properties from the first argument if it is an object
    const firstArg = args[0];
    const errorDetails = {
      message: firstArg?.message || msg,
      stack: firstArg?.stack || new Error().stack || '',
      code: firstArg?.code || firstArg?.status || null,
      details: firstArg?.details || null,
      hint: firstArg?.hint || null,
      type: 'ReactRuntime'
    };

    // Detect if this is a Supabase client query failure (uses classic message + code blocks)
    let context = 'React Frontend Console Error';
    if (msg.includes('supabase') || errorDetails.code === 'PGRST204' || errorDetails.code === '42703' || errorDetails.code === '42501') {
      context = 'Supabase Client API Exception';
      errorDetails.type = 'SupabaseAPI';
    }

    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorDetails,
        context: context
      })
    })
    .catch((err) => {
      originalConsoleError('[AI Logger Error] Failed to upload frontend console error report:', err);
    })
    .finally(() => {
      isReporting = false;
    });
  };

  // Capture globally unhandled window runtime exceptions
  window.addEventListener('error', (event) => {
    if (isReporting) return;
    
    // Ignore benign Vite/websocket/HMR connection warnings and exceptions
    const eventMsg = String(event.message || '').toLowerCase();
    if (
      eventMsg.includes('websocket') || 
      eventMsg.includes('socket') || 
      eventMsg.includes('hmr') || 
      eventMsg.includes('vite') ||
      eventMsg.includes('connection before it has finished')
    ) {
      return;
    }

    isReporting = true;

    const errorDetails = {
      message: event.message || 'Window runtime exception',
      stack: event.error?.stack || '',
      code: 'RUNTIME_ERROR_WINDOW',
      type: 'ReactRuntime'
    };

    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorDetails,
        context: 'React Global window.onerror Catchment'
      })
    })
    .catch(() => {})
    .finally(() => {
      isReporting = false;
    });
  });

  // Capture unhandled promise rejections (this triggers on failed async fetch calls & client supabase triggers)
  window.addEventListener('unhandledrejection', (event) => {
    if (isReporting) return;

    const reason = event.reason;
    const errorMsg = String(reason?.message || reason || '');
    const errorStack = String(reason?.stack || '');
    const combinedLower = (errorMsg + ' ' + errorStack).toLowerCase();

    // Skip benign Hot Module Replacement / websocket / socket close race condition errors
    if (
      combinedLower.includes('websocket') ||
      combinedLower.includes('socket') ||
      combinedLower.includes('hmr') ||
      combinedLower.includes('vite') ||
      combinedLower.includes('unhandledrejection') ||
      combinedLower.includes('establishing the connection') ||
      combinedLower.includes('connection before')
    ) {
      return;
    }

    isReporting = true;

    const errorDetails = {
      message: errorMsg || 'Unhandled Promise Rejection',
      stack: reason?.stack || '',
      code: reason?.code || reason?.status || 'PROMISE_REJECTION',
      type: errorMsg.includes('supabase') || reason?.code === 'PGRST204' || reason?.code === '42703' || reason?.code === '42501' ? 'SupabaseAPI' : 'ReactRuntime'
    };

    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorDetails,
        context: 'React Global unhandledrejection Catchment'
      })
    })
    .catch(() => {})
    .finally(() => {
      isReporting = false;
    });
  });
}
