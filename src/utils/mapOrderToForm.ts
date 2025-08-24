// utils/mapOrderToForm.ts
import type { FormData } from "@/stores/orderStore"; // или продублируй тип
import type { Order } from "@/types/formDataType"

export const mapOrderToFormPatch = (o: Order): Partial<FormData> => ({
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
    description : o.comment ?? "",
    teamId      : o.team ?? "A",
});
