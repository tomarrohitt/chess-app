import { Slash } from "lucide-react";
import { STUB_BLOCKED } from "./community-types";
import { PlayerCard } from "./community-shared";

export function BlockedTab() {
  return (
    <div className="flex flex-col gap-4">
      {STUB_BLOCKED.length === 0 ? (
        // <EmptyState
        //   icon={ShieldOff}
        //   title="No STUB_BLOCKED players"
        //   sub="Players you block won't be able to send you messages or challenges."
        // />
        <div></div>
      ) : (
        <>
          <p
            className="text-xs text-zinc-500"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            {STUB_BLOCKED.length} block
          </p>
          <div className="flex flex-col gap-2">
            {STUB_BLOCKED.map((b) => (
              <PlayerCard
                key={b.id}
                player={b}
                actions={
                  <button
                    className="flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs transition-all hover:bg-red-500/20"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                      fontFamily: "'Fira Code', monospace",
                    }}
                  >
                    <Slash size={11} /> Unblock
                  </button>
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
