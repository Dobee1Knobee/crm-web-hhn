'use client'

import React, { useState } from 'react'
import { usePerformance } from '@/hooks/usePerformance'
import { Activity, Zap, Clock, HardDrive, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const PerformanceMonitor: React.FC = () => {
  const { metrics, getPerformanceScore, getMemoryInfo } = usePerformance()
  const [isExpanded, setIsExpanded] = useState(false)

  const performanceScore = getPerformanceScore()
  const memoryInfo = getMemoryInfo()

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMetricColor = (value: number, good: number, warning: number) => {
    if (value <= good) return 'text-green-600'
    if (value <= warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (process.env.NODE_ENV === 'production') {
    return null // Hide in production
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div 
          className="bg-gray-50 px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Performance
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "text-sm font-bold",
                getScoreColor(performanceScore)
              )}>
                {performanceScore}
              </div>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-4 max-w-sm">
            {/* Performance Score */}
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold mb-1",
                getScoreColor(performanceScore)
              )}>
                {performanceScore}/100
              </div>
              <div className="text-xs text-gray-500">
                Performance Score
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Zap className="h-4 w-4 mr-2" />
                Core Web Vitals
              </h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">CLS</div>
                  <div className={cn(
                    "font-mono",
                    getMetricColor(metrics.cls || 0, 0.1, 0.25)
                  )}>
                    {metrics.cls?.toFixed(3) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">FID</div>
                  <div className={cn(
                    "font-mono",
                    getMetricColor(metrics.fid || 0, 100, 300)
                  )}>
                    {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">FCP</div>
                  <div className={cn(
                    "font-mono",
                    getMetricColor(metrics.fcp || 0, 1800, 3000)
                  )}>
                    {metrics.fcp ? `${(metrics.fcp / 1000).toFixed(1)}s` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">LCP</div>
                  <div className={cn(
                    "font-mono",
                    getMetricColor(metrics.lcp || 0, 2500, 4000)
                  )}>
                    {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(1)}s` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            {memoryInfo && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Memory Usage
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Used:</span>
                    <span className="font-mono">
                      {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-mono">
                      {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Usage:</span>
                    <span className={cn(
                      "font-mono",
                      memoryInfo.usage > 80 ? 'text-red-600' : 
                      memoryInfo.usage > 60 ? 'text-yellow-600' : 'text-green-600'
                    )}>
                      {memoryInfo.usage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TTFB */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Time to First Byte
              </h4>
              <div className={cn(
                "text-sm font-mono",
                getMetricColor(metrics.ttfb || 0, 600, 1800)
              )}>
                {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>

            {/* Legend */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Good</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Needs Improvement</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Poor</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformanceMonitor

