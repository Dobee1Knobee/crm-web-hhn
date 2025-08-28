'use client'
import Header from '../form/components/Header'
import Sidebar from '../form/components/Sidebar'
import TeamSchedule from './components/TeamSchedule'

export default function SchedulePage() {
	
	return (
		<div className="h-screen flex bg-gray-50 overflow-hidden">
			<Sidebar />
			<div className="flex-1 overflow-auto">
				<div className="flex flex-col h-full">
					<Header />
					<div className="flex-1 overflow-auto">
						<TeamSchedule />
					</div>
				</div>
			</div>	
		</div>
	);
}