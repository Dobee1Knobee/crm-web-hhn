import "@/app/global.css"
import Image from "next/image"
import icon from "../../../../public/yellowpng.webp" //

export default function Header() {
    return (
        <div className="w-full">
            <div className="flex flex-col items-center mt-3 border-bottom border-solid gap-2">
                <Image
                    src={icon}
                    alt="Icon"
                    width={100}
                    height={100}
                    className="mr-2"
                />
                {/*<div className="w-full h-1 bg-orange-500"></div>*/}
            </div>

        </div>
    )
}