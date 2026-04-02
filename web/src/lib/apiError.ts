import axios from "axios";

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { message?: string; error?: string }
      | undefined;

    if (payload?.message && payload.message.trim().length > 0) {
      return payload.message;
    }

    if (payload?.error && payload.error.trim().length > 0) {
      return payload.error;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
