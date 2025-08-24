"use client";
import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface ErrorDisplayProps {
    error: string;
    onDismiss?: () => void;
    className?: string;
    variant?: "error" | "warning" | "info";
}

export default function ErrorDisplay({ 
    error, 
    onDismiss, 
    className = "",
    variant = "error" 
}: ErrorDisplayProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case "warning":
                return "bg-amber-50 border-amber-200 text-amber-800";
            case "info":
                return "bg-blue-50 border-blue-200 text-blue-800";
            default:
                return "bg-red-50 border-red-200 text-red-800";
        }
    };

    const getIconColor = () => {
        switch (variant) {
            case "warning":
                return "text-amber-600";
            case "info":
                return "text-blue-600";
            default:
                return "text-red-600";
        }
    };

    return (
        <div className={`border rounded-lg p-3 ${getVariantStyles()} ${className}`}>
            <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getIconColor()}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{error}</p>
                </div>
                {onDismiss && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
