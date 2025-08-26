'use client'
import { useGetCities } from '@/hooks/useCitiesByTeam'
import { useOrderStore } from '@/stores/orderStore'
interface FiltersBarProps {
	dateFrom: string;
	dateTo: string;
	master: string;
	city: string;
	setDateFrom: (value: string) => void;
	setDateTo: (value: string) => void;
	setMaster: (value: string) => void;
	setCity: (value: string) => void;
	onSearch: () => void;
	loading?: boolean;
}
export default function FiltersBar({ dateFrom, dateTo, master, city, setDateFrom, setDateTo, setMaster, setCity, onSearch, loading = false }: FiltersBarProps) {
	// Debug: Check if functions are properly passed
	console.log('FiltersBar props:', { setDateFrom: typeof setDateFrom, setDateTo: typeof setDateTo });
	console.log('Current filter values:', { dateFrom, dateTo, master, city });
	const user = useOrderStore((state) => state.currentUser);
	const { cities, loading: citiesLoading, error } = useGetCities(user?.team || '');
	return (
		<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 m-4 border border-gray-100">
			<div className="flex flex-col items-center gap-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">Search Visits</h1>
					<p className="text-gray-600">Filter visits by date, master, or city</p>
				</div>
				
				<div className="flex items-center flex-row gap-6 w-full max-w-4xl">
					<div className="flex-1">
						<label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
						<div className="flex flex-row gap-2">
						<input 
							type="date" 
							placeholder="Date from" 
							className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm" 
							value={dateFrom} 
							onChange={(e) => setDateFrom && setDateFrom(e.target.value)} 
						/>
							<input 
						type="date" 
						placeholder="TO" 
						className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white shadow-sm" 
						value={dateTo} 
						onChange={(e) => setDateTo && setDateTo(e.target.value)} 
					/>
						</div>
					
						
					</div>
					
					<div className="flex-1">
						<label className="block text-sm font-semibold text-gray-700 mb-2">Master</label>
						<input 
							type="text" 
							placeholder="Enter master name" 
							className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white shadow-sm" 
							value={master} 
							onChange={(e) => setMaster && setMaster(e.target.value)} 
						/>
					</div>
					
					<div className="flex-1">
						<label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
						<select 
							className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 bg-white shadow-sm"
							value={city}
							onChange={(e) => setCity && setCity(e.target.value)}
						>
							<option value="">Select a city</option>
							{cities.map((cityItem) => (
								<option key={cityItem._id} value={cityItem?.name}>
									{cityItem.name}
								</option>
							))}
						</select>
					</div>
				</div>
				
				{/* Search Button */}
				<div className="flex justify-center mt-4">
					<button
						onClick={onSearch}
						disabled={loading}
						className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center space-x-2"
					>
						{loading ? (
							<>
								<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
								<span>Searching...</span>
							</>
						) : (
							<>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
								</svg>
								<span>Search Visits</span>
							</>
						)}
					</button>
				</div>
				
				{(dateFrom || dateTo || master || city) && (
					<div className="flex items-center space-x-2 text-sm text-gray-600">
						<span>Active filters:</span>
						{dateFrom && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Date From: {dateFrom}</span>}
						{dateTo && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Date To: {dateTo}</span>}
						{master && <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Master: {master}</span>}
						{city && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">City: {city}</span>}
					</div>
				)}
			</div>
		</div>
	)
}