"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function SearchUsersForm({
  placeholder,
  query,
}: {
  placeholder: string;
  query: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [text, setText] = useState(query);

  useEffect(() => {
    setText(query);
  }, [query]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (text) {
      params.set("q", text);
    } else {
      params.delete("q");
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <form className="relative" onSubmit={handleSubmit}>
      <Search
        size={13}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
      />
      <input
        placeholder={placeholder}
        className="w-full h-10 rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
        onChange={(e) => setText(e.target.value)}
        value={text}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "'DM Sans', sans-serif",
        }}
      />
    </form>
  );
}
