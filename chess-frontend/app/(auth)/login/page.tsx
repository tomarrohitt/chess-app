import Link from "next/link";
import { LoginForm } from "./_components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div
      className="rounded-2xl p-8 relative overflow-hidden"
      style={{
        backgroundColor: "#111111",
        border: "1px solid rgba(201,168,76,0.2)",
        boxShadow:
          "0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.05) inset",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #c9a84c, transparent)",
        }}
      />

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <span
            className="text-5xl select-none"
            style={{
              color: "#c9a84c",
              filter: "drop-shadow(0 0 12px rgba(201,168,76,0.4))",
            }}
          >
            ♔
          </span>
        </div>
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            color: "#f0e6c8",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome Back
        </h1>
        <p style={{ color: "#5a5a5a", fontSize: "0.875rem" }}>
          Sign in to your account to continue
        </p>
      </div>
      <Suspense fallback={<div>loading...</div>}>
        <LoginForm />
      </Suspense>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: "1px solid #222" }} />
        </div>
        <div className="relative flex justify-center text-sm">
          <span
            className="px-3"
            style={{ backgroundColor: "#111111", color: "#3a3a3a" }}
          >
            Don&apos;t have an account?
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/register"
          className="font-semibold transition-colors duration-200 text-[#c9a84c] hover:text-[#e8c86a]"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
