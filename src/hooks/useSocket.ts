// // useSocket.js (переименуйте в .js, а не .ts)
// import { useEffect, useRef, useState } from 'react';
//
// export const useSocket = (user: {
//     userId: string;
//     userName: string;
//     userAt: string;
//     team: string;
//     manager_id: string;
// }| null) => { // Простой параметр
//     const socketRef = useRef(null);
//     const [isConnected, setIsConnected] = useState(false);
//
//     useEffect(() => {
//         // Проверяем, есть ли данные пользователя
//         if (!user || !user.team || !user.userName) {
//             console.log('❌ Нет данных пользователя для WebSocket');
//             return;
//         }
//
//         console.log(`🔌 Подключаемся как ${user.userName} к команде ${user.team}`);
//
//         // Динамический импорт
//         // eslint-disable-next-line @typescript-eslint/no-require-imports
//         const io = require('socket.io-client');
//         const socket = io('https://bot-crm-backend-756832582185.us-central1.run.app');
//         socketRef.current = socket;
//
//         socket.on('connect', () => {
//             console.log('✅ Подключились!', socket.id);
//             setIsConnected(true);
//
//             // Присоединяемся к команде
//             socket.emit('join-team', {
//                 team: user.team,
//                 username: user.userName
//             });
//             console.log(`📢 Присоединяемся к команде ${user.team}`);
//         });
//
//         // Слушаем подтверждение присоединения
//         socket.on('team-joined', (data) => {
//             console.log('🎉 Присоединились к команде:', data);
//         });
//
//         socket.on('disconnect', () => {
//             console.log('❌ Отключились');
//             setIsConnected(false);
//         });
//
//         return () => {
//             console.log('🔌 Закрываем соединение');
//             socket.disconnect();
//         };
//     }, [user?.team, user?.userName]); // Зависимости для useEffect
//
//     return {
//         socket: socketRef.current,
//         isConnected
//     };
// };