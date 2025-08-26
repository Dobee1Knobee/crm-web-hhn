interface Visit {
	day: string;
	time: string;
	master: string;
}

interface VisitCardProps {
	order_id: string;
	visits: Visit[];
}

export default function VisitCard({ order_id, visits }: VisitCardProps) {
	return (
		<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center space-x-3 gap-2">
					
					<div>
						<h3 className="text-lg font-bold text-gray-800">Order #{order_id}</h3>
						<p className="text-sm text-gray-600">Order Details</p>
					</div>
				</div>
				<div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
					{visits.length} visit{visits.length !== 1 ? 's' : ''}
				</div>
			</div>
			
			<div className="space-y-4">
				{visits.map((visit, index) => (
					<div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
						<div className="flex flex-col justify-between gap-2">
							<div className="flex items-center space-x-4 ">
								<div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
								<div className="flex flex-row items-center space-x-3">
									<p className="font-semibold text-gray-800 text-lg">{visit.day}</p>
									<p className="text-sm text-gray-600 font-medium">{visit.time}</p>
								</div>
							</div>
							<div className="text-right">
								<div className="flex items-center space-x-2 ">
									<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
										<span className="text-white font-bold text-xs">
											{visit.master.charAt(0).toUpperCase()}
										</span>
									</div>
									<div className="flex flex-col start-0">
										<p className="font-semibold text-gray-800">{visit.master}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}