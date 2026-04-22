import { Activity } from "lucide-react";

export function ProfileHeader({ rating }: { rating: number }) {
  return (
    <div className="flex justify-between items-center mb-9">
      <div className="flex items-center gap-2.5">
        <span className="text-[28px] drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]">
          ♔
        </span>
        <span className="text-[20px] font-bold tracking-[0.05em] text-[#e5e5e5]">
          ChessBoard
        </span>
      </div>
      <div className="flex items-center gap-1.5 bg-[#4ade80]/[0.07] border border-[#4ade80]/18 rounded-[20px] px-3.5 py-1.5">
        <Activity size={13} color="#4ade80" />
        <span className="text-[12px] font-semibold text-[#4ade80] font-mono">
          Rating {rating}
        </span>
      </div>
    </div>
  );
}

export function ProfileBackground() {
  return (
    <>
      <div
        className="fixed inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)",
          backgroundSize: "48px 48px",
          backgroundPosition: "0 0, 0 24px, 24px -24px, -24px 0px",
        }}
      />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#000_100%)]" />
    </>
  );
}
