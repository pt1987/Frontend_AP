import { de } from "@/i18n/de";

export const GraphErrorCode = {
  Forbidden: "Forbidden",
  NotFound: "Request_ResourceNotFound",
  Throttled: "TooManyRequests",
  Unauthorized: "Unauthorized",
} as const;

export interface ClassifiedError {
  userMessage: string;
  isRetryable: boolean;
  statusCode: number | null;
}

interface GraphErrorShape {
  statusCode?: number;
  code?: string;
  message?: string;
}

function isGraphErrorShape(error: unknown): error is GraphErrorShape {
  return typeof error === "object" && error !== null;
}

// Classifies Graph API errors into user-friendly messages.
// Throttling (429) is always retryable; auth errors are not.
export function classifyGraphError(error: unknown): ClassifiedError {
  if (!isGraphErrorShape(error)) {
    return {
      userMessage: de.errors.generic,
      isRetryable: false,
      statusCode: null,
    };
  }

  const statusCode = error.statusCode ?? null;

  switch (statusCode) {
    case 403:
      return {
        userMessage: de.errors.forbidden,
        isRetryable: false,
        statusCode,
      };
    case 404:
      return {
        userMessage: de.errors.notFound,
        isRetryable: false,
        statusCode,
      };
    case 429:
      return {
        userMessage: de.errors.throttled,
        isRetryable: true,
        statusCode,
      };
    case 401:
      return {
        userMessage: de.errors.authRequired,
        isRetryable: false,
        statusCode,
      };
    default:
      if (!statusCode) {
        return {
          userMessage: de.errors.networkError,
          isRetryable: true,
          statusCode: null,
        };
      }
      return {
        userMessage: de.errors.generic,
        isRetryable: statusCode >= 500,
        statusCode,
      };
  }
}

// Extracts the Retry-After header value in milliseconds for 429 responses.
// Falls back to exponential backoff if the header is missing.
export function getRetryDelayMs(
  retryAfterHeader: string | null,
  attempt: number
): number {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
  }
  // Exponential backoff: 1s, 2s, 4s for attempts 0, 1, 2
  return Math.pow(2, attempt) * 1000;
}

// Retries an async operation with exponential backoff on retryable errors.
// Maximum 3 attempts total (1 original + 2 retries).
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const classified = classifyGraphError(error);

      if (!classified.isRetryable || attempt === maxAttempts - 1) {
        throw error;
      }

      const delay = getRetryDelayMs(null, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
