"use client";

import { useActionState } from "react";

import { register } from "@/actions/auth";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const initialState = {
  success: false,
  message: "",
  errors: {
    name: "",
    username: "",
    email: "",
    password: "",
  },
  inputs: {
    name: "",
    username: "",
    email: "",
    password: "",
  },
};

export const RegisterForm = () => {
  const [state, action, pending] = useActionState(register, initialState);

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            state.success
              ? "bg-[rgba(74,153,74,0.12)] border-[rgba(74,153,74,0.3)] text-[#6fcf6f]"
              : "bg-[rgba(220,70,70,0.1)] border-[rgba(220,70,70,0.25)] text-[#e07070]"
          }`}
        >
          {state.message}
        </div>
      )}

      <Field className="gap-0">
        <FieldLabel
          className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#5a5a5a]"
          htmlFor="name"
        >
          Full name
        </FieldLabel>
        <Input
          id="name"
          name="name"
          type="text"
          disabled={pending}
          defaultValue={state.inputs.name}
          placeholder="John Doe"
          className="bg-[#0a0a0a] border border-[#222] text-[#e8e8e8] rounded-lg py-2.5 outline-none transition-colors focus:border-[rgba(201,168,76,0.5)]"
        />
        <FieldError className="my-1 text-xs text-[#e07070]">
          {state.errors.name}
        </FieldError>
      </Field>

      <Field className="gap-0">
        <FieldLabel
          className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#5a5a5a]"
          htmlFor="username"
        >
          Username
        </FieldLabel>
        <Input
          id="username"
          name="username"
          disabled={pending}
          defaultValue={state.inputs.username}
          placeholder="johndoe"
          className="bg-[#0a0a0a] border border-[#222] text-[#e8e8e8] rounded-lg py-2.5 outline-none transition-colors focus:border-[rgba(201,168,76,0.5)]"
        />
        <FieldError className="my-1 text-xs text-[#e07070]">
          {state.errors.username}
        </FieldError>
      </Field>

      <Field className="gap-0">
        <FieldLabel
          className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#5a5a5a]"
          htmlFor="email"
        >
          Email address
        </FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          disabled={pending}
          defaultValue={state.inputs.email}
          placeholder="you@example.com"
          className="bg-[#0a0a0a] border border-[#222] text-[#e8e8e8] rounded-lg  py-2.5 outline-none transition-colors focus:border-[rgba(201,168,76,0.5)]"
        />
        <FieldError className="my-1 text-xs text-[#e07070]">
          {state.errors.email}
        </FieldError>
      </Field>

      <Field className="gap-0">
        <FieldLabel
          className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#5a5a5a]"
          htmlFor="password"
        >
          Password
        </FieldLabel>
        <Input
          id="password"
          name="password"
          type="password"
          disabled={pending}
          defaultValue={state.inputs.password}
          placeholder="••••••••••••••••"
          className="bg-[#0a0a0a] border border-[#222] text-[#e8e8e8] rounded-lg py-2.5 outline-none transition-colors focus:border-[rgba(201,168,76,0.5)]"
        />
        <FieldError className="my-1 text-xs text-[#e07070]">
          {state.errors.password}
        </FieldError>
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-2 bg-linear-to-br from-[#c9a84c] to-[#a8863a] text-[#0a0a0a] tracking-[0.03em] shadow-[0_2px_20px_rgba(201,168,76,0.2)] hover:from-[#e8c86a] hover:to-[#c9a84c] hover:shadow-[0_4px_24px_rgba(201,168,76,0.35)] disabled:hover:from-[#c9a84c] disabled:hover:to-[#a8863a] disabled:hover:shadow-[0_2px_20px_rgba(201,168,76,0.2)]"
      >
        {pending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
};
