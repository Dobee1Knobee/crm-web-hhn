'use client'

import React, { memo, useCallback, useMemo } from 'react'
import { Order } from '@/types/domain'
import { formatPhoneNumber, formatDate, formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Clock, MapPin, User, Phone, DollarSign, Edit, Eye } from 'lucide-react'

interface OptimizedOrderCardProps {
  order: Order
  onEdit?: (orderId: string) => void
  onView?: (orderId: string) => void
  onStatusChange?: (orderId: string, newStatus: string) => void
  isSelected?: boolean
  onSelect?: (orderId: string) => void
  className?: string
}

const OptimizedOrderCard: React.FC<OptimizedOrderCardProps> = memo(({
  order,
  onEdit,
  onView,
  onStatusChange,
  isSelected = false,
  onSelect,
  className
}) => {
  // Memoize formatted values to prevent recalculation on every render
  const formattedValues = useMemo(() => ({
    phone: formatPhoneNumber(order.phone),
    date: formatDate(order.date),
    total: formatCurrency(order.total),
    status: order.status,
  }), [order.phone, order.date, order.total, order.status])

  // Memoize status color and text
  const statusInfo = useMemo(() => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'new': { color: 'bg-blue-100 text-blue-800', text: 'Новый' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', text: 'В работе' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'Завершен' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Отменен' },
      'pending': { color: 'bg-gray-100 text-gray-800', text: 'Ожидает' },
    }
    
    return statusMap[order.status] || { color: 'bg-gray-100 text-gray-800', text: order.status }
  }, [order.status])

  // Memoize callback functions to prevent unnecessary re-renders
  const handleEdit = useCallback(() => {
    onEdit?.(order.id)
  }, [onEdit, order.id])

  const handleView = useCallback(() => {
    onView?.(order.id)
  }, [onView, order.id])

  const handleSelect = useCallback(() => {
    onSelect?.(order.id)
  }, [onSelect, order.id])

  const handleStatusChange = useCallback((newStatus: string) => {
    onStatusChange?.(order.id, newStatus)
  }, [onStatusChange, order.id])

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        isSelected && 'ring-2 ring-blue-500 border-blue-300',
        className
      )}
    >
      {/* Header with selection and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">{order.customerName}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            statusInfo.color
          )}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Order details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Phone className="h-4 w-4" />
          <span>{formattedValues.phone}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>{order.address}</span>
          {order.zipCode && (
            <span className="text-gray-400">({order.zipCode})</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{formattedValues.date}</span>
          {order.time && (
            <span className="text-gray-400">в {order.time}</span>
          )}
        </div>
        
        {order.master && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>Мастер: {order.master}</span>
          </div>
        )}
      </div>

      {/* Services summary */}
      {order.services && order.services.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Услуги:</div>
          <div className="space-y-1">
            {order.services.slice(0, 3).map((service, index) => (
              <div key={index} className="text-sm text-gray-600 flex justify-between">
                <span>{service.label}</span>
                <span className="text-gray-500">
                  {service.count > 1 && `${service.count}×`}
                  {formatCurrency(service.price)}
                </span>
              </div>
            ))}
            {order.services.length > 3 && (
              <div className="text-sm text-gray-500 italic">
                +{order.services.length - 3} еще...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with total and actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-lg text-gray-900">
            {formattedValues.total}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {onView && (
            <button
              onClick={handleView}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Просмотреть"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          
          {onEdit && (
            <button
              onClick={handleEdit}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Редактировать"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick status change */}
      {onStatusChange && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Быстрое изменение статуса:</span>
            <div className="flex space-x-1">
              {['new', 'in_progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    status === order.status
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {status === 'new' ? 'Новый' : 
                   status === 'in_progress' ? 'В работе' : 'Завершен'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

OptimizedOrderCard.displayName = 'OptimizedOrderCard'

export default OptimizedOrderCard
