import { getInitials } from "@/lib/constants/get-initials";
import Image from "next/image";

export const PlayerProfile = ({
  name,
  image,
}: {
  name: string;
  image: string | null;
}) => {
  if (!image)
    return (
      <div className="w-full h-full bg-[#181818] flex items-center justify-center">
        <span className="text-[32px] font-bold text-[#4ade80] tracking-[0.05em]">
          {getInitials(name)}
        </span>
      </div>
    );

  return (
    <Image
      src={image}
      alt={name}
      width={100}
      height={100}
      className="w-full h-full object-cover"
    />
  );
};
