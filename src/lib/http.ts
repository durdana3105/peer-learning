import { toast } from "sonner";

type UnknownRecord = Record<string, unknown>;

export type ApiError = {
  message: string;
  code?: string;
  details?: string;
  status?: number;
  cause?: unknown;
};

type AsyncBoundaryOptions = {
  fallbackMessage?: string;
  onError?: (error: ApiError) => void;
};

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export function isAbortError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const name = getString(error.name);
  const code = getString(error.code);

  return name === "AbortError" || code === "ERR_CANCELED" || code === "ABORT_ERR";
}

export function normalizeError(error: unknown, fallbackMessage = "Something went wrong"): ApiError {
  if (typeof error === "string") {
    return { message: error };
  }

  if (isRecord(error)) {
    const message = getString(error.message) || fallbackMessage;

    return {
      message,
      code: getString(error.code),
      details: getString(error.details) || getString(error.hint),
      status: getNumber(error.status),
      cause: error.cause,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      code: getString((error as Error & UnknownRecord).code),
      details: getString((error as Error & UnknownRecord).details),
      status: getNumber((error as Error & UnknownRecord).status),
      cause: (error as any).cause,
    };
  }

  return { message: fallbackMessage, cause: error };
}

export async function withErrorBoundary<T>(
  task: () => Promise<T>,
  options: AsyncBoundaryOptions = {},
): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    const normalized = normalizeError(error, options.fallbackMessage);
    options.onError?.(normalized);
    
    toast.error(normalized.message || "An unexpected error occurred");

    throw normalized;
  }
}

export async function safeSupabaseCall<T>(
  request: () => Promise<{ data: T | null; error: unknown }>,
  options: AsyncBoundaryOptions = {},
): Promise<T | null> {
  return withErrorBoundary(async () => {
    const { data, error } = await request();

    if (error) {
      throw error;
    }

    return data;
  }, options);
}

async function readResponseBody(response: Response): Promise<string | undefined> {
  try {
    const text = await response.text();
    return text.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: AsyncBoundaryOptions = {},
): Promise<T> {
  return withErrorBoundary(async () => {
    const response = await fetch(input, init);

    if (!response.ok) {
      const responseBody = await readResponseBody(response);
      const error = new Error(responseBody || `${response.status} ${response.statusText}`) as Error &
        UnknownRecord;

      error.name = "HttpError";
      error.status = response.status;
      error.details = responseBody;

      throw error;
    }

    return (await response.json()) as T;
  }, options);
}