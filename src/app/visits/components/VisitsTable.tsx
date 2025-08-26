interface Visit {
	day: string;
	time: string;
	master: string;
}

interface VisitData {
	order_id: string;
	visits: Visit[];
}

interface VisitsTableProps {
	data: VisitData[];
}

export default function VisitsTable({ data }: VisitsTableProps) {
	// Группируем визиты по мастерам
	const mastersMap = new Map<string, Visit[]>();
	
	data.forEach(order => {
		order.visits.forEach(visit => {
			if (!mastersMap.has(visit.master)) {
				mastersMap.set(visit.master, []);
			}
			mastersMap.get(visit.master)?.push(visit);
		});
	});
	
	const masters = Array.from(mastersMap.keys());
	
	if (masters.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 text-gray-500">
				<div className="text-6xl mb-4">👥</div>
				<h3 className="text-xl font-medium mb-2">No masters found</h3>
				<p className="text-sm">No visits data available</p>
			</div>
		);
	}
	
	return (
		<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h2 className="text-2xl font-bold text-gray-800">Visits by Master</h2>
					<p className="text-gray-600 mt-1">Overview of all scheduled visits</p>
				</div>
				<div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
					{masters.length} Master{masters.length !== 1 ? 's' : ''}
				</div>
			</div>
			
			<div className="overflow-x-auto">
				<div className="flex space-x-8 min-w-max pb-3 mt-1">
					{masters.map((master, masterIndex) => {
						const visits = mastersMap.get(master) || [];
						const colors = [
							'from-blue-500 to-blue-600',
							'from-emerald-500 to-emerald-600', 
							'from-purple-500 to-purple-600',
							'from-orange-500 to-orange-600',
							'from-pink-500 to-pink-600',
							'from-indigo-500 to-indigo-600'
						];
						const bgColors = [
							'bg-blue-50 border-blue-200',
							'bg-emerald-50 border-emerald-200',
							'bg-purple-50 border-purple-200', 
							'bg-orange-50 border-orange-200',
							'bg-pink-50 border-pink-200',
							'bg-indigo-50 border-indigo-200'
						];
						const textColors = [
							'text-blue-800',
							'text-emerald-800',
							'text-purple-800',
							'text-orange-800', 
							'text-pink-800',
							'text-indigo-800'
						];
						
						const colorIndex = masterIndex % colors.length;
						
						return (
							<div key={master} className="flex-shrink-0 w-80">
								<div className={`${bgColors[colorIndex]} rounded-2xl p-6 border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
									<div className="flex items-center justify-between mb-6">
										<div className="flex items-center space-x-3">
											<div className={`w-12 h-12 bg-gradient-to-r ${colors[colorIndex]} rounded-full flex items-center justify-center shadow-lg`}>
												<span className="text-white font-bold text-lg">
													{master.charAt(0).toUpperCase()}
												</span>
											</div>
											<div>
												<h3 className={`text-xl font-bold ${textColors[colorIndex]}`}>
													{master}
												</h3>
												<p className="text-gray-600 text-sm">Master</p>
											</div>
										</div>
										<div className={`${textColors[colorIndex]} bg-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm`}>
											{visits.length}
										</div>
									</div>
									
									<div className="space-y-3 max-h-96 overflow-y-auto">
										{visits.map((visit, index) => (
											<div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
												<div className="flex items-center justify-between mb-3">
													<div className="flex items-center space-x-2">
														<div className={`w-2 h-2 bg-gradient-to-r ${colors[colorIndex]} rounded-full`}></div>
														<span className="text-sm font-medium text-gray-600">Date</span>
													</div>
													<span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
														{visit.day}
													</span>
												</div>
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-2">
														<div className="w-2 h-2 bg-gray-400 rounded-full"></div>
														<span className="text-sm font-medium text-gray-600">Time</span>
													</div>
													<span className="text-sm font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
														{visit.time}
													</span>
												</div>
											</div>
										))}
									</div>
									
									<div className="mt-6 pt-4 border-t border-gray-200">
										<div className="flex items-center justify-center space-x-2">
											<div className={`w-3 h-3 bg-gradient-to-r ${colors[colorIndex]} rounded-full`}></div>
											<span className="text-sm font-medium text-gray-600">
												{visits.length} visit{visits.length !== 1 ? 's' : ''} scheduled
											</span>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
