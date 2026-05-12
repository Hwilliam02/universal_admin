import { toast } from "../hooks/use-toast";

/**
 * Centralised notification helpers.
 *
 * Every user-facing message should go through these functions so the
 * entire app uses the same toast system with a consistent look.
 */

/** Show a success notification */
export function notifySuccess(title: string, description?: string) {
  toast({ title, description, variant: "default" });
}

/** Show an error notification */
export function notifyError(title: string, description?: string) {
  toast({ title, description, variant: "destructive" });
}

/**
 * Extract a human-friendly error message from an Axios error (or any
 * thrown value) and show a destructive toast.
 */
export function notifyApiError(err: unknown, fallback = "Something went wrong") {
  const msg =
    (err as any)?.response?.data?.message ||
    (err as any)?.message ||
    fallback;
  notifyError(msg);
}
