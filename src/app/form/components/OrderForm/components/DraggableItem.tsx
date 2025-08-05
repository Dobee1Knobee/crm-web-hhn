import { useDraggable } from "@dnd-kit/core";

interface DraggableItemProps {
    item: {
        label: string;
        price: number;
        value?: string;
    };
    category: string;
    isActive?: boolean;
}

export function DraggableItem({ item, category, isActive = false }: DraggableItemProps) {
    const itemId = item.value || item.label;

    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: itemId,
        data: {
            service: {
                id: itemId,
                name: item.label,
                price: item.price,
                value: itemId,
                category: category
            }
        }
    });

    // Определяем цвета для разных категорий
    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'main':
                return {
                    bg: 'bg-gradient-to-r from-red-500 to-red-600',
                    bgHover: 'hover:from-red-400 hover:to-red-500',
                    border: 'border-red-300',
                    shadow: 'shadow-red-200'
                };
            case 'additional':
                return {
                    bg: 'bg-gradient-to-r from-orange-500 to-orange-600',
                    bgHover: 'hover:from-orange-400 hover:to-orange-500',
                    border: 'border-orange-300',
                    shadow: 'shadow-orange-200'
                };
            case 'materials':
                return {
                    bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
                    bgHover: 'hover:from-yellow-400 hover:to-yellow-500',
                    border: 'border-yellow-300',
                    shadow: 'shadow-yellow-200'
                };
            default:
                return {
                    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
                    bgHover: 'hover:from-gray-400 hover:to-gray-500',
                    border: 'border-gray-300',
                    shadow: 'shadow-gray-200'
                };
        }
    };

    const styles = getCategoryStyles(category);

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
                rounded-lg text-white text-center text-xs font-medium 
                px-3 py-2 min-h-[58px] flex flex-col justify-center items-center 
                transition-all duration-200 cursor-grab active:cursor-grabbing relative
                transform-gpu will-change-transform
                ${styles.bg} ${styles.bgHover}
                hover:scale-105 hover:shadow-lg ${styles.shadow}
                ${isDragging || isActive ? 'opacity-30 scale-95' : 'opacity-100'}
            `}
        >
            <span className="leading-tight font-semibold">{item.label}</span>
            <span className="text-[11px] mt-1 opacity-90">${item.price}</span>

            {/* Индикатор что элемент можно перетаскивать */}
            {!isDragging && !isActive && (
                <div className="absolute top-1 right-1 w-2 h-2 opacity-40">
                    <div className="w-full h-full bg-white rounded-full animate-pulse"></div>
                </div>
            )}

            {/* Эффект при hover */}
            <div className="absolute inset-0 rounded-lg bg-white opacity-0 hover:opacity-10 transition-opacity duration-200"></div>
        </div>
    );
}
