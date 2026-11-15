import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const DURATION = { success: 3200, info: 3800, error: 6000 };
const RESUME_AFTER_HOVER = 1800;
const MAX_VISIBLE = 4;
const EXIT_MS = 220;

const ICONS = {
  success: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  error: <path d="M12 7v6M12 17h.01" />,
  info: <path d="M12 11v6M12 7h.01" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const visible = useRef([]);
  const counter = useRef(0);

  useEffect(() => {
    visible.current = toasts;
  }, [toasts]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const schedule = useCallback(
    (id, ms) => {
      clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ms)
      );
    },
    [dismiss]
  );

  const push = useCallback(
    (message, kind = "info") => {
      const type = ICONS[kind] ? kind : "info";
      const duration = DURATION[type];
      const existing = visible.current.find((t) => t.message === message && t.kind === type && !t.leaving);
      if (existing) {
        schedule(existing.id, duration);
        setToasts((list) =>
          list.map((t) => (t.id === existing.id ? { ...t, duration, bump: t.bump + 1 } : t))
        );
        return existing.id;
      }
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [
        ...list.filter((t) => !t.leaving).slice(-(MAX_VISIBLE - 1)),
        { id, message, kind: type, duration, bump: 0 },
      ]);
      schedule(id, duration);
      return id;
    },
    [schedule]
  );

  const pause = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const resume = useCallback(
    (id) => {
      schedule(id, RESUME_AFTER_HOVER);
      setToasts((list) =>
        list.map((t) => (t.id === id ? { ...t, duration: RESUME_AFTER_HOVER, bump: t.bump + 1 } : t))
      );
    },
    [schedule]
  );

  const api = useMemo(() => {
    const toast = (message, kind) => push(message, kind);
    toast.success = (message) => push(message, "success");
    toast.error = (message) => push(message, "error");
    toast.info = (message) => push(message, "info");
    toast.dismiss = dismiss;
    return toast;
  }, [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.kind}${t.leaving ? " leaving" : ""}`}
            role={t.kind === "error" ? "alert" : "status"}
            onMouseEnter={() => pause(t.id)}
            onMouseLeave={() => resume(t.id)}
            onFocus={() => pause(t.id)}
            onBlur={() => resume(t.id)}
          >
            <span className="toast-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                {t.kind === "success" && ICONS.success}
                {t.kind === "error" && ICONS.error}
                {t.kind === "info" && ICONS.info}
              </svg>
            </span>
            <span className="toast-message">{t.message}</span>
            <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <span
              key={t.bump}
              className="toast-bar"
              style={{ animationDuration: `${t.duration}ms` }}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
