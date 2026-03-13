import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chess",
    description: "Sign in or create an account",
};

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-lvh bg-linear-to-br from-blue-500 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
            <div className="w-full max-w-xl">{children}</div>
        </div>
    );
}