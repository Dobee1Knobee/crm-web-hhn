import {useOrderStore} from "@/stores/orderStore";

const colorMap = {
    indigo: {
        from: 'from-indigo-50',
        to: 'to-blue-50',
        border: 'border-indigo-200',
        circle: 'bg-indigo-500',
        text: 'text-indigo-700',
        subtext: 'text-indigo-600',
        progressBg: 'bg-indigo-200',
        progressFill: 'bg-indigo-500',
    },
    yellow: {
        from: 'from-yellow-50',
        to: 'to-orange-50',
        border: 'border-yellow-200',
        circle: 'bg-yellow-500',
        text: 'text-yellow-700',
        subtext: 'text-yellow-600',
        progressBg: 'bg-yellow-200',
        progressFill: 'bg-yellow-500',
    },
    green: {
        from: 'from-green-50',
        to: 'to-emerald-50',
        border: 'border-green-200',
        circle: 'bg-green-500',
        text: 'text-green-700',
        subtext: 'text-green-600',
        progressBg: 'bg-green-200',
        progressFill: 'bg-green-500',
    }
};

export default function StatisticBuffer() {
    const statistics = {
        fromOtherTeams: 6,
        internalTransfers: 4,
        pendingOrders: 9
    };

    const maxValues = {
        fromOtherTeams: 10,
        internalTransfers: 10,
        pendingOrders: 20
    };

    const formatNumber = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="bg-white shadow-lg rounded-2xl p-6 m-6">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card
                    value={statistics.fromOtherTeams}
                    max={maxValues.fromOtherTeams}
                    icon="🌍"
                    colorKey="indigo"
                    title="From Other Teams"
                    subtitle="External Orders"
                />

                <Card
                    value={statistics.internalTransfers}
                    max={maxValues.internalTransfers}
                    icon="🔁"
                    colorKey="yellow"
                    title="Internal Transfers"
                    subtitle="Within Your Team"
                />

                <Card
                    value={statistics.pendingOrders}
                    max={maxValues.pendingOrders}
                    icon="🕒"
                    colorKey="green"
                    title="Pending Orders"
                    subtitle="Waiting for Processing"
                />
            </div>
        </div>
    );
}

type ColorKey = keyof typeof colorMap;

function Card({
                  value,
                  max,
                  icon,
                  colorKey,
                  title,
                  subtitle
              }: {
    value: number;
    max: number;
    icon: string;
    colorKey: ColorKey;
    title: string;
    subtitle: string;
}) {
    const percent = Math.min((value / max) * 100, 100);
    const colors = colorMap[colorKey];

    return (
        <div className={`bg-gradient-to-r ${colors.from} ${colors.to} rounded-xl p-4 ${colors.border} hover:shadow-md transition-all duration-200`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${colors.circle} rounded-full flex items-center justify-center shadow-lg`}>
                        <span className="text-white text-xl">{icon}</span>
                    </div>
                    <div>
                        <div className={`text-sm font-medium ${colors.text}`}>{title}</div>
                        <div className={`text-xs ${colors.subtext}`}>{subtitle}</div>
                    </div>
                </div>
                <div className={`text-3xl font-bold ${colors.text}`}>
                    {value.toString().padStart(2, '0')}
                </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
                <div className={`h-2 ${colors.progressBg} rounded-full flex-1`}>
                    <div
                        className={`h-2 ${colors.progressFill} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
                <span className={`text-xs ${colors.subtext} font-medium`}>
                    {Math.round(percent)}%
                </span>
            </div>
        </div>
    );
}
