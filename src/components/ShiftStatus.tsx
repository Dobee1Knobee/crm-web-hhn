"use client"
import { useOrderStore } from '@/stores/orderStore'

interface ShiftStatusProps {
    showDetails?: boolean;
    variant?: 'header' | 'sidebar';
    className?: string;
}

export default function ShiftStatus({ showDetails = true, variant = 'sidebar', className = '' }: ShiftStatusProps) {
    const { shift, toggleShift } = useOrderStore();

    const handleToggle = () => {
        toggleShift();
    };

    if (variant === 'header') {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {/* Статус смены */}
                <div className="flex items-center gap-2">
                    <div className={`
                        w-2 h-2 rounded-full transition-colors duration-300
                        ${shift ? 'bg-green-500' : 'bg-red-500'}
                    `} />
                    <span className={`
                        text-xs font-medium transition-colors duration-300
                        ${shift ? 'text-green-600' : 'text-red-600'}
                    `}>
                        {shift ? 'On Shift' : 'Off Shift'}
                    </span>
                </div>
                
                {/* Переключатель */}
                <button
                    onClick={handleToggle}
                    className={`
                        relative inline-flex h-5 w-10 items-center rounded-full
                        transition-all duration-300 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-opacity-75
                        shadow-sm hover:shadow-md transform hover:scale-105
                        ${shift 
                            ? 'bg-green-500 hover:bg-green-600 focus:ring-green-300' 
                            : 'bg-gray-400 hover:bg-gray-500 focus:ring-gray-300'
                        }
                    `}
                    title={shift ? 'Click to go Off Shift' : 'Click to go On Shift'}
                >
                    <span
                        className={`
                            inline-block h-3 w-3 transform rounded-full
                            bg-white shadow-sm transition-transform duration-300 ease-in-out
                            ${shift ? 'translate-x-5' : 'translate-x-1'}
                        `}
                    />
                </button>
            </div>
        );
    }

    // Для sidebar - более детальный вид
    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            {/* Статус смены */}
            <div className="flex items-center gap-2">
                <div className={`
                    w-3 h-3 rounded-full transition-colors duration-300
                    ${shift ? 'bg-green-500' : 'bg-red-500'}
                `} />
                <span className={`
                    text-sm font-medium transition-colors duration-300
                    ${shift ? 'text-green-600' : 'text-red-600'}
                `}>
                    {shift ? 'On Shift' : 'Off Shift'}
                </span>
            </div>
            
            {/* Переключатель */}
            <button
                onClick={handleToggle}
                className={`
                    relative inline-flex h-8 w-16 items-center rounded-full
                    transition-all duration-300 ease-in-out
                    focus:outline-none focus:ring-2 focus:ring-opacity-75
                    shadow-md hover:shadow-lg transform hover:scale-105
                    ${shift 
                        ? 'bg-green-500 hover:bg-green-600 focus:ring-green-300' 
                        : 'bg-gray-400 hover:bg-gray-500 focus:ring-gray-300'
                    }
                `}
                title={shift ? 'Click to go Off Shift' : 'Click to go On Shift'}
            >
                <span
                    className={`
                        inline-block h-6 w-6 transform rounded-full
                        bg-white shadow-lg transition-transform duration-300 ease-in-out
                        ${shift ? 'translate-x-9' : 'translate-x-1'}
                    `}
                >
                    <div className="flex items-center justify-center h-full">
                        {shift ? (
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </span>
            </button>
            
            {/* Дополнительная информация */}
            {showDetails && (
                <div className="text-center">
                    <span className="text-xs text-gray-500">
                        {shift ? '🟢 Active and working' : '🔴 Not available'}
                    </span>
                </div>
            )}
        </div>
    );
}
