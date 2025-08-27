'use client'
import "keen-slider/keen-slider.min.css"
import { useKeenSlider } from "keen-slider/react"
import { useState } from "react"

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
	// Функция для получения дня недели
	const getDayOfWeek = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { weekday: 'short' });
	};

	// Функция для сортировки визитов по дате и времени
	const sortVisitsByDateTime = (visits: Visit[]): Visit[] => {
		return visits.sort((a, b) => {
			// Функция для парсинга времени в 24-часовом формате
			const parseTime = (timeStr: string): number => {
				const time = timeStr.toLowerCase();
				if (time.includes('pm')) {
					const hour = parseInt(time.replace('pm', ''));
					return hour === 12 ? 12 : hour + 12;
				} else if (time.includes('am')) {
					const hour = parseInt(time.replace('am', ''));
					return hour === 12 ? 0 : hour;
				}
				return parseInt(time);
			};

			// Создаем даты для сравнения
			const dateA = new Date(a.day);
			const dateB = new Date(b.day);
			
			// Если даты разные, сортируем по дате
			if (dateA.getTime() !== dateB.getTime()) {
				return dateA.getTime() - dateB.getTime();
			}
			
			// Если даты одинаковые, сортируем по времени
			const timeA = parseTime(a.time);
			const timeB = parseTime(b.time);
			return timeA - timeB;
		});
	};

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

	// Сортируем визиты для каждого мастера
	mastersMap.forEach((visits, master) => {
		mastersMap.set(master, sortVisitsByDateTime(visits));
	});
	
	const masters = Array.from(mastersMap.keys());
	
	// Добавляем состояние для отслеживания текущего слайда
	const [currentSlide, setCurrentSlide] = useState(0);

	// Вычисляем количество слайдов на экране в зависимости от количества мастеров
	const slidesPerView = Math.min(masters.length, 4);
	
	// Добавляем хук keen-slider
	const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
		loop: masters.length > 4, // Зацикливание только если мастеров больше 4
		slides: {
			perView: slidesPerView,
			spacing: 10,
		},
		slideChanged(slider) {
			setCurrentSlide(slider.track.details.rel);
		},
	});
	
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
		<div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100 overflow-hidden">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h2 className="text-2xl font-bold text-gray-800">Visits by Master</h2>
					<p className="text-gray-600 mt-1">Overview of all scheduled visits</p>
				</div>
				<div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
					{masters.length} Master{masters.length !== 1 ? 's' : ''}
				</div>
			</div>
			
			{/* Карусель с кнопками навигации */}
			<div className="relative max-w-full">
								{/* Кнопка "Влево" */}
				{slider.current && masters.length > 4 && (
					<button
						onClick={() => slider.current?.prev()}
						className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black text-white rounded-full p-2 w-12 h-12 flex items-center justify-center shadow-md hover:bg-gray-800 transition-colors"
					>
						<span className="text-3xl font-light">‹</span>
					</button>
				)}
				
				{/* Кнопка "Вправо" */}
				{slider.current && masters.length > 4 && (
					<button
						onClick={() => slider.current?.next()}
						className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black text-white rounded-full p-2 w-12 h-12 flex items-center justify-center shadow-md hover:bg-gray-800 transition-colors"
					>
						<span className="text-3xl font-light">›</span>
					</button>
				)}
				
				{/* Слайдер */}
				<div ref={sliderRef} className="keen-slider">
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
							<div key={master} className="keen-slider__slide">
								<div className={`${bgColors[colorIndex]} rounded-2xl p-6 mt-1 border-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
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
														{visit.day} {getDayOfWeek(visit.day)}
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
			
			{/* Индикаторы (точки) - показываем только если мастеров больше 4 */}
			{masters.length > 4 && (
				<div className="flex justify-center gap-2 mt-6">
					{Array.from({ length: Math.ceil(masters.length / slidesPerView) }, (_, idx) => (
						<div
							key={idx}
							className={`w-3 h-3 rounded-full transition-all duration-300 ${
								currentSlide === idx
									? "bg-black scale-110"
									: "bg-gray-400 opacity-60"
							}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
