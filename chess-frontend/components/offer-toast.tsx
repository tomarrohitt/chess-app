"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface OfferToastProps {
  id: string | null;
  title: string;
  timeControl: string;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

export function OfferToast({
  id,
  title,
  timeControl,
  onAccept,
  onDecline,
  onDismiss,
}: OfferToastProps) {
  const acceptRef = useRef(onAccept);
  const declineRef = useRef(onDecline);
  const dismissRef = useRef(onDismiss);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    acceptRef.current = onAccept;
    declineRef.current = onDecline;
    dismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (id) {
      lastIdRef.current = id;
      toast(title, {
        id,
        description: (
          <div className="flex flex-col gap-2 mt-1 w-full">
            <span>Time Control: {timeControl}</span>
            <div className="h-1 w-full bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-300 origin-left toast-progress-bar"
                style={{
                  animation: "offer-toast-progress 15s linear forwards",
                }}
              />
            </div>
          </div>
        ),
        duration: 15000,
        onAutoClose: () => dismissRef.current(),
        onDismiss: () => dismissRef.current(),
        classNames: {
          actionButton:
            "!bg-transparent hover:!bg-zinc-800 !border-0 !p-2 !-ml-1",
          cancelButton: "!bg-transparent hover:!bg-zinc-800 !border-0 !p-2",
        },
        action: {
          label: (
            <Check size={22} strokeWidth={6} className="text-emerald-500" />
          ),
          onClick: () => acceptRef.current(),
        },
        cancel: {
          label: <X size={22} strokeWidth={6} className="text-rose-500" />,
          onClick: () => declineRef.current(),
        },
      });
    } else if (lastIdRef.current) {
      toast.dismiss(lastIdRef.current);
      lastIdRef.current = null;
    }
  }, [id, title, timeControl]);

  return null;
}
