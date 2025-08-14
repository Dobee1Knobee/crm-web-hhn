interface BufferCardProps {
    id: string;
    transferredFrom: string;
    team: string;
    timeAgo: string;
    clientId: string;
    address?: string;
    date: string;
    time: string;
    amount: number;
    type?: 'external' | 'internal' | 'pending';
    onClaim?: () => void;
    disabledClaim?: boolean; // 🆕 можно отключать кнопку
}

export default function BufferCard({
                                       id,
                                       transferredFrom,
                                       team,
                                       timeAgo,
                                       clientId,
                                       address = "Address not specified",
                                       date,
                                       time,
                                       amount,
                                       type = 'external',
                                       onClaim,
                                       disabledClaim = false
                                   }: BufferCardProps) {

    const getTypeConfig = (orderType: string) => {
        switch (orderType) {
            case 'external':
                return {
                    badge: 'From Other Team',
                    badgeColor: 'bg-indigo-500',
                    cardBorder: 'border-indigo-300',
                    cardGradient: 'from-indigo-50 to-blue-50',
                    icon: '🌍'
                };
            case 'internal':
                return {
                    badge: 'Internal Transfer',
                    badgeColor: 'bg-yellow-500',
                    cardBorder: 'border-yellow-300',
                    cardGradient: 'from-yellow-50 to-orange-50',
                    icon: '🔁'
                };
            case 'pending':
                return {
                    badge: 'Pending Processing',
                    badgeColor: 'bg-green-500',
                    cardBorder: 'border-green-300',
                    cardGradient: 'from-green-50 to-emerald-50',
                    icon: '🕒'
                };
            default:
                return {
                    badge: 'In buffer',
                    badgeColor: 'bg-orange-500',
                    cardBorder: 'border-orange-300',
                    cardGradient: 'from-orange-50 to-yellow-50',
                    icon: '📋'
                };
        }
    };

    const config = getTypeConfig(type);

    const getTransferText = () => {
        switch (type) {
            case 'external':
                return `Transferred from: ${transferredFrom} from team ${team}`;
            case 'internal':
                return `Internal transfer from: ${transferredFrom}`;
            case 'pending':
                return `Assigned by: ${transferredFrom}`;
            default:
                return `Transferred from: ${transferredFrom} from team ${team}`;
        }
    };

    return (
        <div className={`bg-white border-2 ${config.cardBorder} rounded-xl p-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br ${config.cardGradient}`}>
            {/* Header with ID and Badge */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800">ID: {id}</h2>
                <span className={`${config.badgeColor} text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1`}>
          <span>{config.icon}</span>
                    {config.badge}
        </span>
            </div>

            {/* Transfer info */}
            <div className="flex items-start justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-start">
                    <span className="mr-2 mt-0.5">{config.icon}</span>
                    <div>
                        <div className="font-semibold">{getTransferText()}</div>
                    </div>
                </div>
                <div className="flex items-center text-gray-500 ml-2">
                    <span className="mr-1">🕐</span>
                    <span className="whitespace-nowrap">{timeAgo}</span>
                </div>
            </div>

            {/* Client ID */}
            <div className="flex items-center text-sm text-gray-600 mb-2">
                <span className="mr-2">🆔</span>
                Client ID: #{clientId}
            </div>

            {/* Address */}
            <div className="flex items-start text-sm text-gray-600 mb-2">
                <span className="mr-2 mt-0.5">📍</span>
                <span className="break-words">{address}</span>
            </div>

            {/* Date and Time */}
            <div className="flex items-center text-sm text-gray-600 mb-4">
                <span className="mr-2">📅</span>
                {date}, {time}
            </div>

            {/* Bottom section with amount and claim button */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center">
                    <span className="text-2xl mr-2">💰</span>
                    <span className="text-xl font-bold text-green-600">${amount}</span>
                </div>

                <button
                    onClick={!disabledClaim ? onClaim : undefined}
                    disabled={disabledClaim}
                    className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 flex items-center
            ${disabledClaim ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    title={disabledClaim ? 'Недоступно' : 'Claim'}
                >
                    <span className="mr-2">👋</span>
                    Claim
                </button>
            </div>
        </div>
    );
}
