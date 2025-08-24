// utils/mapApiServicesToSelected.ts
import type { OrderService, ServiceItem } from "@/types/formDataType";

type CatalogEntry = { label: string; value: string; price: number };
type ServiceCatalog = {
    workTypes: CatalogEntry[];
    additionalServices: CatalogEntry[];
    mounts: CatalogEntry[];
    materials: CatalogEntry[];
};

type ApiAddonOrMaterial = {
    label: string;
    value: string;  // должен совпадать с value из каталога
    price: number;
    count: number;
    _id?: string;
};

type ApiService = {
    label: string;          // напр. "Large"
    value?: string;         // может отсутствовать у main
    diagonal?: string|number;
    count: number;
    price: number;
    addons?: ApiAddonOrMaterial[];
    materials?: ApiAddonOrMaterial[];
    _id?: string;
};

const genOrderId = () => Math.floor(Date.now() + Math.random() * 1000);

export function mapApiServicesToSelected(
    apiServices: OrderService[],
    catalog: ServiceCatalog
): ServiceItem[] {
    // индексы каталога
    const byLabel = (arr: CatalogEntry[]) =>
        Object.fromEntries(arr.map(e => [e.label, e]));
    const byValue = (arr: CatalogEntry[]) =>
        Object.fromEntries(arr.map(e => [e.value, e]));

    const wtByLabel  = byLabel(catalog.workTypes);
    const wtByValue  = byValue(catalog.workTypes);
    const addByValue = byValue(catalog.additionalServices);
    const matsByValue= byValue(catalog.materials);
    const mountsByValue = byValue(catalog.mounts); // считаем как materials

    // быстрый классификатор под-элементов
    const classify = (val: string): "additional" | "materials" => {
        if (addByValue[val]) return "additional";
        if (matsByValue[val] || mountsByValue[val]) return "materials";
        return "additional"; // дефолт — пусть будет additional
    };

    return apiServices.map(s => {
        // найти main в каталоге по label/value
        const mainCat =
            (s.value ? wtByValue[s.value] : undefined) ||
            wtByLabel[s.label];

        const mainOrderId = genOrderId();

        // собрать subItems: addons + materials
        const subItems: ServiceItem[] = [];

        const pushSub = (arr: ApiAddonOrMaterial[] | undefined) => {
            (arr ?? []).forEach(x => {
                const cat = classify(x.value);
                const catalogEntry =
                    addByValue[x.value] || matsByValue[x.value] || mountsByValue[x.value];

                subItems.push({
                    id: x.value,
                    name: catalogEntry?.label ?? x.label,
                    value: x.value,
                    category: cat,
                    price: x.price ?? catalogEntry?.price ?? 0,
                    quantity: x.count ?? 1,
                    orderId: genOrderId(),
                    parentMainItemId: mainOrderId,
                } as ServiceItem);
            });
        };

        pushSub(s.addons);
        pushSub(s.materials);

        // Определяем, нужна ли кастомная цена
        const needsCustomPrice = (s.label === "NO TV" || s.label === "Custom" || s.value === "noTV" || s.value === "custom");
        const customPrice = needsCustomPrice ? s.price : undefined;

        const main: ServiceItem = {
            id:   mainCat?.value ?? (s.value ?? s.label.toLowerCase()),
            name: mainCat?.label ?? s.label,
            value: mainCat?.value ?? (s.value ?? s.label.toLowerCase()),
            category: "main",
            price: mainCat?.price ?? 0, // Используем цену из каталога как базовую
            customPrice: customPrice, // Устанавливаем кастомную цену если нужно
            quantity: s.count ?? 1,
            orderId: mainOrderId,
            subItems,
            diagonals: s.diagonal ? [String(s.diagonal)] : [],
        };

        return main;
    });
}
