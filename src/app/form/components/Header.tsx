"use client"
import "@/app/global.css"
import ConnectionStatus from "@/components/ConnectionStatus"
import ShiftStatus from "@/components/ShiftStatus"
import Image from "next/image"
import icon from "../../../../public/yellowpng.webp"

export default function Header() {
    return (
        <div className="w-full">
            {/* Simple and ergonomic header with centered logo and compact connection status */}
            <div className="flex items-center justify-center px-4 py-3 bg-white border-b border-gray-100 shadow-sm relative">
              
                {/* Centered Logo - Original style */}
                <Image
                    src={icon}
                    alt="TV Mount Master"
                    width={70}
                    height={100}
                />
                
                {/* Compact Status Indicators - Top Right */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-4">
                    {/* Статус смены */}
                    <ShiftStatus 
                        showDetails={false} 
                        variant="header"
                        className="text-xs"
                    />
                    
                    {/* Статус соединения */}
                    <ConnectionStatus 
                        showDetails={false} 
                        variant="header"
                        className="text-xs"
                    />
                </div>
            </div>
        </div>
    )
}
