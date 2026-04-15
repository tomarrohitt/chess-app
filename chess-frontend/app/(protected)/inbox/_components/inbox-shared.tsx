import { getAvatarHue } from "@/app/(protected)/community/_components/community-shared";

export function Avatar({
  name,
  image,
  size = 44,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  const hue = getAvatarHue(name);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: image ? "transparent" : `hsl(${hue},45%,32%)`,
        color: `hsl(${hue},80%,82%)`,
        fontFamily: "'Fira Code', monospace",
      }}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export function formatTime(dateString: string | Date) {
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
