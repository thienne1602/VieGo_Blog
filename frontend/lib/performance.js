/**
 * Performance monitoring utilities for VieGo Blog
 */

// Performance metrics collector
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  // Start timing a operation
  startTimer(name) {
    this.metrics.set(name, performance.now());
  }

  // End timing and log result
  endTimer(name) {
    const startTime = this.metrics.get(name);
    if (startTime) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      this.metrics.delete(name);
      return duration;
    }
    return 0;
  }

  // Measure component render time
  measureRender(componentName) {
    return (WrappedComponent) => {
      return function MeasuredComponent(props) {
        const renderStart = performance.now();

        useEffect(() => {
          const renderEnd = performance.now();
          const renderTime = renderEnd - renderStart;
          if (renderTime > 100) {
            // Log slow renders (>100ms)
            console.warn(
              `🐌 Slow render - ${componentName}: ${renderTime.toFixed(2)}ms`
            );
          }
        });

        return <WrappedComponent {...props} />;
      };
    };
  }

  // Web Vitals monitoring
  initWebVitals() {
    if (typeof window !== "undefined") {
      // Largest Contentful Paint
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });

      try {
        observer.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        console.log("LCP monitoring not supported");
      }

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log(`📊 FID: ${entry.processingStart - entry.startTime}ms`);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        console.log("FID monitoring not supported");
      }
    }
  }

  // API call performance tracking
  trackApiCall(url, method = "GET") {
    const startTime = performance.now();
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        if (duration > 1000) {
          // Log slow API calls (>1s)
          console.warn(
            `🐌 Slow API call - ${method} ${url}: ${duration.toFixed(2)}ms`
          );
        }
        return duration;
      },
    };
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    apiCalls: 0,
    slowOperations: 0,
  });

  const trackRender = useCallback((componentName) => {
    const startTime = performance.now();
    return () => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 100) {
        setMetrics((prev) => ({
          ...prev,
          slowOperations: prev.slowOperations + 1,
        }));
      }
      setMetrics((prev) => ({
        ...prev,
        renderTime: renderTime,
      }));
    };
  }, []);

  const trackApi = useCallback(() => {
    setMetrics((prev) => ({
      ...prev,
      apiCalls: prev.apiCalls + 1,
    }));
  }, []);

  return { metrics, trackRender, trackApi };
};

// Initialize performance monitoring
if (typeof window !== "undefined") {
  perfMonitor.initWebVitals();
}

export default perfMonitor;
