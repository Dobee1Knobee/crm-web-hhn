"use client";

import ConnectionStatus from './ConnectionStatus';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                                    <div className="w-6 h-6 bg-white rounded-sm"></div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">TV Mount</h1>
                                    <p className="text-sm text-gray-600">Master</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center space-x-4">
                        <ConnectionStatus showDetails={true} variant="header" />
                    </div>
                </div>
            </div>
        </header>
    );
}
