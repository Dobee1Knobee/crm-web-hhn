'use client'

import { useOrderStore } from '@/stores/orderStore'
import { Check, Globe, MapPin, X } from 'lucide-react'
import React from 'react'
import toast from 'react-hot-toast'

interface AddressApproveModalProps {
    isOpen: boolean
    onClose: () => void
    detectedAddress: {
        address: string
        zipCode: string
        city: string
    }
}

export const AddressApproveModal: React.FC<AddressApproveModalProps> = ({
    isOpen,
    onClose,
    detectedAddress
}) => {
    const { updateFormData } = useOrderStore()

    const handleApply = () => {
        // Применяем детектированный адрес
				console.log(detectedAddress);
        updateFormData('address', detectedAddress.address)
        updateFormData('zipCode', detectedAddress.zipCode)
        updateFormData('city', detectedAddress.city)
        
        toast.success('✅ Address automatically updated!')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                {/* Заголовок */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        Apply Detected Address
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Описание */}
                <p className="text-sm text-gray-600 mb-4">
                    We detected a more accurate address. Would you like to apply it?
                </p>

                {/* Детектированный адрес */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Detected Address:
                    </div>
                    <div className="space-y-1 text-sm text-blue-700">
                        <div><strong>Address:</strong> {detectedAddress.address}</div>
                        <div><strong>City:</strong> {detectedAddress.city}</div>
                        <div><strong>ZIP Code:</strong> {detectedAddress.zipCode}</div>
                    </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Keep Current
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Apply Detected
                    </button>
                </div>
            </div>
        </div>
    )
}
