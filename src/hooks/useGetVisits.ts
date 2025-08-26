import { useOrderStore } from '@/stores/orderStore'
import { useEffect, useState } from 'react'

interface Visit {
	day: string;
	time: string;
	master: string;
}

interface VisitData {
	order_id: string;
	visits: Visit[];
}

export const useGetVisits = (dateFrom?: string, dateTo?: string, master?: string, city?: string, triggerSearch?: boolean) => {
	const [data, setData] = useState<VisitData[] | null>(null);
	const at = useOrderStore((state) => state.currentUser?.userAt);
	const [loading, setLoading] = useState(false);
	
	const fetchVisits = async () => {
		if (!at) return;
		
		setLoading(true);
		try {
			const formatDate = (dateStr: string) => {
				if (!dateStr) return '';
				if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
				const date = new Date(dateStr);
				if (isNaN(date.getTime())) return '';
				return date.toISOString().split('T')[0];
			};

			const formattedDateFrom = formatDate(dateFrom || '');
			const formattedDateTo = formatDate(dateTo || '');

			const params = new URLSearchParams({
				dateFrom: formattedDateFrom,
				dateTo: formattedDateTo,
				master: master || '',
				city: city || '',
				at: at
			});		
			
			console.log('Original dates:', { dateFrom, dateTo });
			console.log('Formatted dates:', { formattedDateFrom, formattedDateTo });
			console.log('Full URL:', `https://bot-crm-backend-756832582185.us-central1.run.app/api/orders/get-visits?${params}`);
			
			const response = await fetch(`https://bot-crm-backend-756832582185.us-central1.run.app/api/orders/get-visits?${params}`);
			const result = await response.json();
			console.log('API Response:', result);
			setData(result.orders || []);
		} catch (error) {
			console.error('Error fetching visits:', error);
			setData(null);
		} finally {
			setLoading(false);
		}
	};

	// Auto-search when triggerSearch changes (for manual search button)
	useEffect(() => {
		if (triggerSearch && at) {
			fetchVisits();
		}
	}, [triggerSearch, at]);
	
	return { data, loading, fetchVisits };
}