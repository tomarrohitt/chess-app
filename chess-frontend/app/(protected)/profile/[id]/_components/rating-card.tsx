export function RatingCard({ rating }: { rating: number }) {
  return (
    <div className="bg-[#141414] border border-[#242424] rounded-[14px] backdrop-blur-sm p-7 relative overflow-hidden">
      <div className="absolute -top-15 -right-15 w-55 h-55 bg-[radial-gradient(circle,rgba(74,222,128,0.04)_0%,transparent_70%)] rounded-full" />
      <div className="relative z-10 flex justify-between items-center">
        <div>
          <p className="text-[11px] text-[#4a4a4a] uppercase tracking-[0.12em] mb-2 font-mono">
            Current Rating
          </p>
          <p
            className="text-[56px] font-bold text-[#4ade80] m-0 leading-none"
            style={{ textShadow: "0 0 24px rgba(74,222,128,0.25)" }}
          >
            {rating}
          </p>
          <p className="text-[12px] text-[#3a3a3a] mt-1.5 font-mono">
            ELO Points
          </p>
        </div>
        <div className="shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#4ade80"
              strokeWidth="10"
              strokeDasharray={`${(rating / 2000) * 314} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ filter: "drop-shadow(0 0 5px #4ade80)" }}
            />
            <text
              x="60"
              y="55"
              textAnchor="middle"
              fill="#d4d4d4"
              fontSize="13"
              fontWeight="700"
            >
              {Math.round((rating / 2000) * 100)}%
            </text>
            <text x="60" y="72" textAnchor="middle" fill="#555" fontSize="9">
              to Master
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}
