import { serviceCatalog } from "@/catalog/serviceCatalog";
import { DraggableItem } from "@/app/form/components/OrderForm/components/DraggableItem";

interface Props {
    activeId?: string | null;
}

export default function ServicesWindow({ activeId }: Props) {
    const workOptions = serviceCatalog.workTypes;
    const addons = serviceCatalog.additionalServices;
    const materials = serviceCatalog.materials;

    const renderDraggable = (item: { label: string; price: number; value?: string }, category: string) => (
        <DraggableItem
            key={item.value || item.label}
            item={item}
            category={category}
            isActive={activeId === (item.value || item.label)}
        />
    );

    return (
        <div className="bg-white shadow-md rounded-2xl p-6 space-y-6">
            <div className="flex items-center">
                <span className="h-3 w-3 bg-orange-500 rounded-full mr-3"></span>
                <h2 className="text-lg font-bold text-gray-900">Services & Add-ons</h2>
            </div>

            {/* Main Services */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Main Services</h3>
                <div className="grid grid-cols-3 gap-2">
                    {workOptions.map(item => renderDraggable(item, 'main'))}
                </div>
            </div>

            {/* Additional Services */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Services</h3>
                <div className="grid grid-cols-5 gap-2">
                    {addons.map(item => renderDraggable(item, 'additional'))}
                </div>
            </div>

            {/* Materials & Hardware */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Materials & Hardware</h3>
                <div className="grid grid-cols-4 gap-2">
                    {materials.map(item => renderDraggable(item, 'materials'))}
                </div>
            </div>
        </div>
    );
}
