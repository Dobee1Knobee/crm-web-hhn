'use client'

import { useEffect, useCallback, useState } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface PerformanceMetrics {
  cls: number | null
  fid: number | null
  fcp: number | null
  lcp: number | null
  ttfb: number | null
}

interface PerformanceReport {
  metrics: PerformanceMetrics
  timestamp: number
  url: string
  userAgent: string
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  // Report metrics to analytics service
  const reportMetrics = useCallback((report: PerformanceReport) => {
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Google Analytics, Sentry, or custom endpoint
      console.log('📊 Performance Report:', report)
      
      // You can implement your analytics service here
      // analytics.track('performance_metrics', report)
    } else {
      console.log('📊 Performance Report (Dev):', report)
    }
  }, [])

  // Initialize performance monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return

    setIsMonitoring(true)

    // Monitor Core Web Vitals
    getCLS((metric) => {
      setMetrics(prev => ({ ...prev, cls: metric.value }))
      reportMetrics({
        metrics: { ...metrics, cls: metric.value },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })

    getFID((metric) => {
      setMetrics(prev => ({ ...prev, fid: metric.value }))
      reportMetrics({
        metrics: { ...metrics, fid: metric.value },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })

    getFCP((metric) => {
      setMetrics(prev => ({ ...prev, fcp: metric.value }))
      reportMetrics({
        metrics: { ...metrics, fcp: metric.value },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })

    getLCP((metric) => {
      setMetrics(prev => ({ ...prev, lcp: metric.value }))
      reportMetrics({
        metrics: { ...metrics, lcp: metric.value },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })

    getTTFB((metric) => {
      setMetrics(prev => ({ ...prev, ttfb: metric.value }))
      reportMetrics({
        metrics: { ...metrics, ttfb: metric.value },
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      })
    })
  }, [isMonitoring, metrics, reportMetrics])

  // Monitor memory usage
  const getMemoryInfo = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory: MemoryInfo }).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      }
    }
    return null
  }, [])

  // Monitor long tasks
  useEffect(() => {
    if (!isMonitoring) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Tasks longer than 50ms
          console.warn('⚠️ Long task detected:', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
          })
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['longtask'] })
    } catch {
      console.warn('Long task monitoring not supported')
    }

    return () => observer.disconnect()
  }, [isMonitoring])

  // Monitor resource loading
  useEffect(() => {
    if (!isMonitoring) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          if (resourceEntry.duration > 1000) { // Resources taking longer than 1s
            console.warn('🐌 Slow resource loading:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize,
            })
          }
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['resource'] })
    } catch {
      console.warn('Resource monitoring not supported')
    }

    return () => observer.disconnect()
  }, [isMonitoring])

  // Start monitoring on mount
  useEffect(() => {
    startMonitoring()
  }, [startMonitoring])

  // Get performance score based on metrics
  const getPerformanceScore = useCallback(() => {
    let score = 100

    // CLS scoring (0-0.1 is good, 0.1-0.25 is needs improvement, >0.25 is poor)
    if (metrics.cls !== null) {
      if (metrics.cls > 0.25) score -= 30
      else if (metrics.cls > 0.1) score -= 15
    }

    // FID scoring (<100ms is good, 100-300ms is needs improvement, >300ms is poor)
    if (metrics.fid !== null) {
      if (metrics.fid > 300) score -= 25
      else if (metrics.fid > 100) score -= 10
    }

    // FCP scoring (<1.8s is good, 1.8-3s is needs improvement, >3s is poor)
    if (metrics.fcp !== null) {
      if (metrics.fcp > 3000) score -= 20
      else if (metrics.fcp > 1800) score -= 10
    }

    // LCP scoring (<2.5s is good, 2.5-4s is needs improvement, >4s is poor)
    if (metrics.lcp !== null) {
      if (metrics.lcp > 4000) score -= 25
      else if (metrics.lcp > 2500) score -= 10
    }

    return Math.max(0, score)
  }, [metrics])

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    getMemoryInfo,
    getPerformanceScore,
    reportMetrics,
  }
}

// Add MemoryInfo interface for TypeScript
interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}
