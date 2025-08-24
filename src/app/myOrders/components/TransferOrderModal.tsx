import { useOrderStore } from "@/stores/orderStore"
import { AlertTriangle, ArrowRight, Send, Shuffle, Users } from "lucide-react"
import React, { useEffect, useState } from 'react'
import toast from "react-hot-toast"

export type TransferOrderModalProps = {
    isOpen: boolean
    onClose: () => void
    orderId?: string
    currentTeam?: 'A' | 'B' | 'C'
    onTransfer: (targetTeam: 'A' | 'B' | 'C' | 'INTERNAL', comment?: string) => void
}

const teamNames = {
    A: 'Team A',
    B: 'Team B',
    C: 'Team C',
    INTERNAL: 'Within My Team'
}

const teamColors = {
    A: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
    B: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
    C: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
    INTERNAL: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
}

export default function TransferOrderModal({
                                               isOpen,
                                               onClose,
                                               orderId,
                                               currentTeam,
                                               onTransfer
                                           }: TransferOrderModalProps) {
    const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | 'C' | 'INTERNAL' | null>(null)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Get socket connection status from store
    const socket = useOrderStore(state => state.socket);
    const currentUser = useOrderStore(state => state.currentUser);
    const isSocketConnected = socket?.connected || false;

    // Close by clicking on backdrop
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    // Reset state when closing
    useEffect(() => {
        if (!isOpen) {
            setSelectedTeam(null)
            setComment('')
            setIsSubmitting(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleTransfer = async () => {
        if (!selectedTeam) return

        // Determine the actual target team
        let actualTargetTeam: 'A' | 'B' | 'C' | 'INTERNAL';

        if (selectedTeam === 'INTERNAL') {
            // For internal transfer, pass INTERNAL to parent
            actualTargetTeam = 'INTERNAL';
        } else {
            actualTargetTeam = selectedTeam;
        }

        // Check socket connection for teams A, B, C (but not for internal transfers)
        if (['A', 'B', 'C'].includes(selectedTeam) && !isSocketConnected) {
            toast.error("Refresh page and try again");
            return;
        }

        setIsSubmitting(true)
        try {
            await onTransfer(actualTargetTeam, comment.trim() || undefined)
            onClose()
        } catch (error) {
            console.error('Error transferring order:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to transfer order';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false)
        }
    }

    const availableTeams = (['A', 'B', 'C'] as const).filter(team => team !== currentTeam)
    const allTransferOptions = [...availableTeams, 'INTERNAL'] as const

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto transition-all duration-200 scale-100">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Send className="text-blue-600" size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Transfer Order</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Order information */}
                    {orderId && (
                        <div className="text-center bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-500 mb-1">Order</div>
                            <div className="text-lg font-semibold text-gray-900">ID: {orderId}</div>
                            {currentTeam && (
                                <div className="text-sm text-gray-600 mt-1">
                                    Current team: <span className="font-medium">{teamNames[currentTeam]}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Team selection */}
                    <div>
                        <div className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <Users size={16} />
                            Select team to transfer to:
                        </div>
                        <div className="space-y-2">
                            {allTransferOptions.map((team) => (
                                <button
                                    key={team}
                                    onClick={() => setSelectedTeam(team)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                                        selectedTeam === team
                                            ? teamColors[team] + ' ring-2 ring-offset-2 ring-current'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${
                                            team === 'A' ? 'bg-red-500' :
                                                team === 'B' ? 'bg-blue-500' :
                                                    team === 'C' ? 'bg-green-500' :
                                                        'bg-purple-500'
                                        }`} />
                                        <span className="font-medium flex items-center gap-2">
                                            {team === 'INTERNAL' && <Shuffle size={16} />}
                                            {team === 'INTERNAL' ? `Within Team ${currentUser?.team || 'Unknown'}` : teamNames[team]}
                                        </span>
                                    </div>
                                    {selectedTeam === team && (
                                        <ArrowRight size={16} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="text-sm font-medium text-gray-900 mb-2 block">
                            Comment (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Add a comment for the order transfer..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={3}
                            maxLength={200}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                            {comment.length}/200
                        </div>
                    </div>

                    {/* Important notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-amber-600 mt-0.5">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <div className="font-medium text-amber-800 mb-1">Warning!</div>
                                <div className="text-sm text-amber-700">
                                    {selectedTeam === 'INTERNAL'
                                        ? 'Internal transfer will reassign the order to another team member within your team.'
                                        : 'After transfer, the order will be moved to the selected team and will no longer be accessible to the current team.'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Socket connection warning */}
                    {selectedTeam && !isSocketConnected && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-red-600 mt-0.5">
                                    <AlertTriangle size={18} />
                                </div>
                                <div>
                                    <div className="font-medium text-red-800 mb-1">Connection Issue!</div>
                                    <div className="text-sm text-red-700">
                                        You are not connected to the server. Please refresh the page and try again.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={!selectedTeam || isSubmitting}
                        className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Transfer Order
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}