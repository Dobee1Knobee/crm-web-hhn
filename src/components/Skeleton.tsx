'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  animate?: boolean
  'data-testid'?: string
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width,
  height,
  rounded = 'md',
  animate = true,
  'data-testid': testId = 'skeleton'
}) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  return (
    <div
      data-testid={testId}
      className={cn(
        'bg-gray-200',
        roundedClasses[rounded],
        animate && 'animate-pulse',
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  )
}

// Predefined skeleton components
export const OrderCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton width={120} height={20} />
      <Skeleton width={80} height={16} />
    </div>
    <Skeleton width="100%" height={16} />
    <Skeleton width="60%" height={16} />
    <div className="flex gap-2">
      <Skeleton width={60} height={24} />
      <Skeleton width={80} height={24} />
    </div>
  </div>
)

export const FormSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
    </div>
    <Skeleton width="100%" height={40} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
      <Skeleton width="100%" height={40} />
    </div>
    <Skeleton width="100%" height={100} />
  </div>
)

export const TableSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4 py-3">
        <Skeleton width={60} height={20} />
        <Skeleton width={120} height={20} />
        <Skeleton width={100} height={20} />
        <Skeleton width={80} height={20} />
        <Skeleton width={60} height={20} />
      </div>
    ))}
  </div>
)

export const BufferSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton width={100} height={18} />
          <Skeleton width={60} height={16} />
        </div>
        <Skeleton width="80%" height={16} />
        <div className="flex gap-2">
          <Skeleton width={80} height={32} />
          <Skeleton width={60} height={32} />
        </div>
      </div>
    ))}
  </div>
)

export default Skeleton
