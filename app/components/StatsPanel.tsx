interface Stats {
  total: number;
  checked_in: number;
  remaining: number;
}

interface StatsPanelProps {
  stats: Stats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  const checkInPercentage = stats.total > 0 ? Math.round((stats.checked_in / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
        <div className="text-xs sm:text-sm text-gray-500">Total</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.checked_in}</div>
        <div className="text-xs sm:text-sm text-gray-500">Checked In</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.remaining}</div>
        <div className="text-xs sm:text-sm text-gray-500">Remaining</div>
      </div>
      <div className="text-center">
        <div className="text-xl sm:text-2xl font-bold text-purple-600">{checkInPercentage}%</div>
        <div className="text-xs sm:text-sm text-gray-500">Complete</div>
      </div>
    </div>
  );
}
