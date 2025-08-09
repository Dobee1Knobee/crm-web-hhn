// // src/hooks/useOrders.ts
// import { useState, useEffect } from 'react';
// import { Order } from "@/types/domain";
// import { PaginationInfo, OrderService } from "@/services/orderService";
// import { useOrderStore } from "@/stores/orderStore";
//
// interface UseOrdersOptions {
//     username: string;
//     page?: number;
//     limit?: number;
//     autoFetch?: boolean;
// }
//
// interface UseOrdersReturn {
//     orders: Order[];
//     loading: boolean;
//     error: string | null;
//     pagination: PaginationInfo | null;
//     refetch: () => Promise<void>;
//     fetchMore: () => Promise<void>;
// }
//
// export const useOrders = ({
//                               username,
//                               page = 1,
//                               limit = 10,
//                               autoFetch = true
//                           }: UseOrdersOptions): UseOrdersReturn => {
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [pagination, setPagination] = useState<PaginationInfo | null>(null);
//     const [currentPage, setCurrentPage] = useState(page);
//
//     const { orders, setOrders, setLoading: setStoreLoading } = useOrderStore();
//
//     const fetchOrders = async (pageToFetch: number = currentPage, append: boolean = false) => {
//         try {
//             setLoading(true);
//             setStoreLoading(true);
//             setError(null);
//
//             const result = await OrderService.getUserOrders(username, pageToFetch, limit);
//
//             if (append) {
//                 setOrders([...orders, ...result.orders]);
//             } else {
//                 setOrders(result.orders);
//             }
//
//             setPagination(result.pagination);
//             setCurrentPage(pageToFetch);
//
//         } catch (err) {
//             const errorMessage = err instanceof Error ? err.message : 'Unknown error';
//             setError(errorMessage);
//         } finally {
//             setLoading(false);
//             setStoreLoading(false);
//         }
//     };
//
//     const fetchMore = async () => {
//         if (pagination?.hasNext) {
//             await fetchOrders(currentPage + 1, true);
//         }
//     };
//
//     const refetch = async () => {
//         await fetchOrders(1, false);
//     };
//
//     useEffect(() => {
//         if (autoFetch && username) {
//             fetchOrders();
//         }
//     }, [username, autoFetch]);
//
//     return {
//         orders,
//         loading,
//         error,
//         pagination,
//         refetch,
//         fetchMore
//     };
// };
