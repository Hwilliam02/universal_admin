import React, { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { clearUser, setUser } from "../store/userSlice";
import { persistor } from "../store/store";
import api from "../api";

/**
 * AuthGuard — mount once at the app root.
 *
 * 1. On startup, if a persisted token exists, validates it against GET /auth/me.
 *    If the token is expired/invalid or belongs to a different user, the state is
 *    cleared and the user is redirected to login.
 *
 * 2. Listens for `storage` events so when one tab logs in/out, all other tabs
 *    on the same origin stay in sync instead of showing stale user data.
 */
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.user.accessToken);
  const storedUser = useAppSelector((s) => s.user.user);
  const validated = useRef(false);

  // ── 1. Validate persisted token on mount ──────────────────────────
  useEffect(() => {
    if (validated.current) return;
    validated.current = true;

    if (!accessToken) return; // no session to validate

    (async () => {
      try {
        const resp = await api.get("/auth/me");
        const freshUser = resp.data;

        // If the persisted user id doesn't match the token's user, fix it
        if (storedUser?.id !== freshUser.id || storedUser?.email !== freshUser.email) {
          dispatch(
            setUser({
              user: {
                id: freshUser.id,
                global_user_id: freshUser.global_user_id,
                email: freshUser.email,
                full_name: freshUser.full_name,
                first_name: freshUser.first_name,
                last_name: freshUser.last_name,
                name: freshUser.full_name,
                username: freshUser.username,
                role: freshUser.role,
              },
              accessToken,
            })
          );
        }
      } catch (err: any) {
        // Only clear on explicit 401 (expired/invalid token).
        // Network errors (server down, timeout, etc.) should NOT log the
        // user out — we just silently skip validation and try again next load.
        if (err?.response?.status === 401) {
          dispatch(clearUser());
          await persistor.purge();
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 2. Cross-tab sync via storage events ──────────────────────────
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // redux-persist stores under "persist:user"
      if (e.key !== "persist:user") return;

      if (e.newValue === null) {
        // Another tab cleared the storage (logout)
        dispatch(clearUser());
        return;
      }

      try {
        const parsed = JSON.parse(e.newValue);
        // redux-persist double-serializes each slice value
        const inner = typeof parsed === "string" ? JSON.parse(parsed) : parsed;

        if (!inner.isAuthenticated || inner.isAuthenticated === "false") {
          dispatch(clearUser());
        } else {
          // Another tab logged in — pick up the new user
          const user = typeof inner.user === "string" ? JSON.parse(inner.user) : inner.user;
          const token = typeof inner.accessToken === "string"
            ? inner.accessToken.replace(/^"|"$/g, "") // strip wrapping quotes from double-serialisation
            : inner.accessToken;

          if (user && token) {
            dispatch(setUser({ user, accessToken: token }));
          }
        }
      } catch {
        // Malformed — ignore
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthGuard;
