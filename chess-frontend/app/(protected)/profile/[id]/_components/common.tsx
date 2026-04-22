interface LegendDotProps {
  color: string;
  label: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}

interface MiniStatProps {
  label: string;
  value: string | number;
}

export function LegendDot({ color, label }: LegendDotProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[11px] text-[#525252]">{label}</span>
    </div>
  );
}

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <div className="flex flex-col items-center bg-[#111] rounded-[10px] py-3 px-2 border border-[#1e1e1e]">
      <span className="text-[22px] font-bold text-[#e5e5e5]">{value}</span>
      <span className="text-[11px] text-[#4a4a4a] mt-0.5 uppercase tracking-[0.06em]">
        {label}
      </span>
    </div>
  );
}

export function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className="bg-[#141414] border border-[#242424] rounded-[14px] backdrop-blur-sm py-5 px-4 flex flex-col items-center gap-1">
      <span className="text-[18px] font-bold font-mono" style={{ color }}>
        {icon}
      </span>
      <span className="text-[36px] font-bold leading-[1.1]" style={{ color }}>
        {value}
      </span>
      <span className="text-[11px] text-[#4a4a4a] uppercase tracking-[0.08em] mt-0.5">
        {label}
      </span>
    </div>
  );
}
