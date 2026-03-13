type RawErrors = {
    errors: string[];
    properties?: Record<string, { errors: string[] }>;
};

export function simplifyZodErrors(
    treeError: RawErrors
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