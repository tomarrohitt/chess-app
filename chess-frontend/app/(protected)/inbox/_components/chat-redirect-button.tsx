import { useParams, useRouter } from "next/navigation";

export const ChatRedirectBtn = ({
  children,
  fid,
}: {
  children: React.ReactNode;
  fid: string;
}) => {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  return (
    <div
      onClick={() => router.push(`/inbox/${fid}`)}
      className="group flex items-center gap-3 p-2.5 rounded-xl transition-all w-full text-left cursor-pointer hover:bg-white/5"
      style={{
        background: id === fid ? "rgba(255,255,255,0.08)" : "transparent",
      }}
    >
      {children}
    </div>
  );
};
