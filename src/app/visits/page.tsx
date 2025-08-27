'use client'
import { useGetVisits } from '@/hooks/useGetVisits'
import { useState } from 'react'
import Header from '../form/components/Header'
import Sidebar from '../form/components/Sidebar'
import FiltersBar from './components/FiltersBar'
import VisitCard from './components/VisitCard'
import VisitsTable from './components/VisitsTable'

interface Visit {
	day: string;
	time: string;
	master: string;
}

interface VisitData {
	order_id: string;
	visits: Visit[];
}

export default function Visits() {
	const today = new Date();
	const endOfWeek = new Date(today);
	endOfWeek.setDate(today.getDate() + 7) ;
	
	const formatDateForInput = (date: Date): string => {
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${year}-${month}-${day}`;
	};
	
	const dateFromInit = formatDateForInput(today);
	const dateToInit = formatDateForInput(endOfWeek);
	const [dateFrom, setDateFrom] = useState(dateFromInit);
	const [dateTo, setDateTo] = useState(dateToInit);
	const [master, setMaster] = useState('');
	const [city, setCity] = useState('');
	const [triggerSearch, setTriggerSearch] = useState(true); // Автоматически запускаем поиск
	const { data, loading, fetchVisits } = useGetVisits(dateFrom, dateTo, master, city, triggerSearch);

	const handleSearch = () => {
		setTriggerSearch(prev => !prev); // Toggle to trigger useEffect
	};
	return (
		<div className="h-screen flex bg-gray-50 overflow-hidden">
			<Sidebar />
			<div className="flex-1 flex flex-col w-96">
				<Header />
				<div className="flex-1 overflow-y-auto">
					<FiltersBar 
						dateFrom={dateFrom}
						dateTo={dateTo}
						master={master}
						city={city}
						setDateFrom={setDateFrom}
						setDateTo={setDateTo}
						setMaster={setMaster}
						setCity={setCity}
						onSearch={handleSearch}
						loading={loading}
					/>
					
					{loading && (
						<div className="flex justify-center items-center h-32">
							<div className="flex items-center space-x-2">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
								<span className="text-lg text-gray-600">Loading visits...</span>
							</div>
						</div>
					)}
					
					{data && data.length > 0 ? (
						<div className="p-4 space-y-6">
							<div className="mb-4">
								<h2 className="text-xl font-semibold text-gray-800">
									Found {data.length} order{data.length !== 1 ? 's' : ''}
								</h2>
							</div>
							
							<VisitsTable data={data} />
							
							<div className="mt-6 overflow-hidden">
								<h3 className="text-lg font-semibold text-gray-800 mb-4">Individual Orders</h3>
								<div style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
									gap: '1.5rem',
									justifyItems: 'center',
									padding: '1rem',
									width: '100%'
								}}>
									{data.map((visit: VisitData) => (
										<VisitCard 
											key={visit.order_id} 
											visits={visit.visits} 
											order_id={visit.order_id} 
										/>
									))}
								</div>
							</div>
						</div>
					) : !loading && (
						<div className="flex flex-col items-center justify-center h-64 text-gray-500">
							<div className="text-6xl mb-4">🔍</div>
							<h3 className="text-xl font-medium mb-2">No visits found</h3>
							<p className="text-sm">Try adjusting your search filters</p>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}