import { toast } from "../hooks/use-toast";

/**
 * Copy text to the clipboard and show a toast notification.
 *
 * Uses the modern Clipboard API when available (secure contexts) and
 * falls back to the legacy `document.execCommand("copy")` trick for
 * insecure HTTP origins (e.g. `http://192.168.x.x`).
 *
 * @param text    The string to copy.
 * @param label   A human-friendly name for what was copied (shown in toast).
 *                Pass `false` to suppress the toast entirely.
 */
export async function copyToClipboard(
  text: string,
  label: string | false = "Link"
): Promise<boolean> {
  let ok = false;

  // Modern API — only available in secure contexts (HTTPS / localhost)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Some browsers throw even when the API exists (e.g. permissions denied)
    }
  }

  // Fallback: create a temporary textarea, select its content and copy
  if (!ok) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      // Keep it off-screen
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      ok = document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      ok = false;
    }
  }

  // Show feedback (unless suppressed)
  if (label !== false) {
    toast({
      title: ok ? `${label} copied!` : "Copy failed",
      description: ok ? undefined : "Your browser blocked clipboard access. Please copy manually.",
      variant: ok ? "default" : "destructive",
    });
  }

  return ok;
}
