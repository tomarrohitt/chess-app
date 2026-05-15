type RawErrors = {
  errors: string[];
  properties?: Record<string, { errors: string[] }>;
};

interface AuthApiError {
  errors: Array<{ message: string }>;
}

export function simplifyZodErrors(
  treeError: RawErrors,
): Record<string, string> {
  const simplifiedErrors: Record<string, string> = {};

  if (treeError.properties) {
    Object.entries(treeError.properties).forEach(([key, value]) => {
      if (value?.errors && value.errors.length > 0) {
        simplifiedErrors[key] = value.errors[0];
      }
    });
  }

  return simplifiedErrors;
}

export function isAuthApiError(error: unknown): error is AuthApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as Record<string, unknown>).errors)
  );
}

export function handleServerApiError(error: unknown) {
  return isAuthApiError(error)
    ? error.errors[0]?.message
    : "An unexpected error occurred";
}
