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
		<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 w-full h-96 flex flex-col">
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-3">
					<div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
						{visits.length} visit{visits.length !== 1 ? 's' : ''}
					</div>
				</div>
				<div className="text-right">
					<h3 className="text-lg font-bold text-gray-800">Lead ID: {order_id}</h3>
					<p className="text-sm text-gray-600">Order Details</p>
				</div>
			</div>
			
			{/* Visits List */}
			<div className="flex-1 space-y-3 overflow-y-auto">
				{visits.map((visit, index) => (
					<div key={index} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
						<div className="flex items-center justify-between">
							{/* Date and Time */}
							<div className="flex items-center space-x-3">
								<div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
								<div className="flex flex-col">
									<p className="font-semibold text-gray-800 text-base">{visit.day}</p>
									<p className="text-sm text-gray-600">{visit.time}</p>
								</div>
							</div>
							
							{/* Master Info */}
							<div className="flex items-center space-x-2">
								<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
									<span className="text-white font-bold text-xs">
										{visit.master.charAt(0).toUpperCase()}
									</span>
								</div>
								<p className="font-semibold text-gray-800 text-sm">{visit.master}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}