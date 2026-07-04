import type { AuthError } from "@supabase/supabase-js";

export const AUTH_SERVICE_UNAVAILABLE_MESSAGE =
  "Authentication service is currently unavailable. The database instance may be paused or undergoing maintenance. Please contact the administrator.";

const NETWORK_ERROR_PATTERNS = [
  "failed to fetch",
  "err_name_not_resolved",
  "networkerror",
  "network error",
  "fetch failed",
  "load failed",
  "blocked",
  "unavailable",
  "dns",
];

export const isAuthServiceUnavailable = (error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : "";

  const normalizedMessage = message.toLowerCase();

  return NETWORK_ERROR_PATTERNS.some((pattern) =>
    normalizedMessage.includes(pattern),
  );
};

export const toAuthError = (error: unknown) => {
  if (isAuthServiceUnavailable(error)) {
    return new Error(AUTH_SERVICE_UNAVAILABLE_MESSAGE);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error || "Authentication request failed."));
};

type SupabaseAuthResponse<TData = unknown> = {
  data?: TData;
  error: AuthError | Error | null;
};

type SupabaseAuthRequest = () => Promise<SupabaseAuthResponse>;
type SupabaseAuthData<TRequest extends SupabaseAuthRequest> =
  Awaited<ReturnType<TRequest>> extends { data: infer TData } ? TData : null;

export const runSupabaseAuthRequest = async <TRequest extends SupabaseAuthRequest>(
  request: TRequest,
): Promise<SupabaseAuthResponse<SupabaseAuthData<TRequest> | null>> => {
  try {
    const { data, error } = await request();

    if (error) {
      return {
        data: null,
        error: toAuthError(error),
      };
    }

    return {
      data: (data ?? null) as SupabaseAuthData<TRequest> | null,
      error: null,
    };
  } catch (error) {
    console.error("Supabase authentication request failed:", error);

    return {
      data: null,
      error: toAuthError(error),
    };
  }
};
