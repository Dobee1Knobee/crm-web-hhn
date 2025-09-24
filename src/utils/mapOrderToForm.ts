// utils/mapOrderToForm.ts
import type { FormData } from "@/stores/orderStore"; // или продублируй тип
import type { Order } from "@/types/formDataType";

export const mapOrderToFormPatch = (o: Order): Partial<FormData> => {
    console.log('mapOrderToFormPatch input:', o);
    console.log('additionalTechName:', o.additionalTechName);
    console.log('dateSlots:', o.dateSlots);
    console.log('city from order:', o.city);
    
    const result = {
        customerName: o.leadName ?? "",
        custom: o.custom ?? 0,
        phoneNumber : o.phone ?? "",
        
        text_status : o.text_status ?? "",
        address     : o.address ?? "",
        zipCode     : o.zip_code ?? "",
        date        : o.date ?? "",
        time        : o.time ?? "",
        city        : o.city ?? "New_York",
        masterId    : o.manager_id ?? "",
        masterName  : o.master ?? "",
        additionalTechName: o.additionalTechName ?? "",
        dateSlots: o.dateSlots ?? [],
        additionalTechSlots: o.additionalTechSlots ?? [],
        description : o.comment ?? "",
        teamId      : o.team ?? "A",
    };
    
    console.log('mapOrderToFormPatch result:', result);
    console.log('city in result:', result.city);
    return result;
};
