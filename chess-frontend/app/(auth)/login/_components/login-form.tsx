"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { login } from "@/actions/auth";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const initialState = {
    success: false,
    message: "",
    errors: {
        email: "",
        password: "",
    },
    inputs: {
        email: "",
        password: "",
    },
};

export const LoginForm = () => {
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/";

    const [state, action, pending] = useActionState(
        login.bind(null, redirectTo),
        initialState,
    );

    return (
        <form action={action} className="space-y-6">
            {state.message && (
                <div
                    className={`p-4 rounded-md text-sm ${state.success
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                        }`}
                >
                    {state.message}
                </div>
            )}

            <Field className="gap-0">
                <FieldLabel className="mb-1" htmlFor="email">
                    Email address
                </FieldLabel>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    disabled={pending}
                    defaultValue={state.inputs.email}
                    placeholder="you@example.com"
                />
                <FieldError className="my-1 text-xs">{state.errors.email}</FieldError>
            </Field>

            <Field className="gap-0">
                <div className="flex items-center justify-between mb-1">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    disabled={pending}
                    defaultValue={state.inputs.password}
                    placeholder="•••••••••••••••••"
                />
                <FieldError className="my-1 text-xs">
                    {state.errors.password}
                </FieldError>
            </Field>

            <button
                type="submit"
                disabled={pending}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {pending ? (
                    <>
                        <Loader2 className="size-5 animate-spin mr-2" />

                        Signing in…
                    </>
                ) : (
                    "Sign In"
                )}
            </button>
        </form>
    );
};