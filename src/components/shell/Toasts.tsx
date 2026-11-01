import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useEffect } from "react";
import { useApp } from "../../store/AppStore";
import type { Toast as ToastModel } from "../../store/AppStore";

const TONE = {
  success: {
    Icon: CircleCheck,
    iconClass: "text-ok",
  },
  error: {
    Icon: CircleAlert,
    iconClass: "text-danger",
  },
  info: {
    Icon: Info,
    iconClass: "text-info",
  },
};

function ToastCard({ toast }: { toast: ToastModel }) {
  const { dispatch } = useApp();
  const { Icon, iconClass } = TONE[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(
      () => dispatch({ type: "dismissToast", id: toast.id }),
      4200,
    );
    return () => window.clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div className="toast" role="status">
      <Icon
        size={15}
        strokeWidth={1.9}
        className={`mt-[1px] shrink-0 ${iconClass}`}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium leading-[1.35] text-ink">
          {toast.title}
        </div>
        {toast.description && (
          <div className="mt-[2px] text-[11.5px] leading-[1.4] text-ink-3">
            {toast.description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "dismissToast", id: toast.id })}
        className="-mr-1 -mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-ink-4 transition-colors hover:bg-hover hover:text-ink-2"
        aria-label="关闭通知"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

export function Toasts() {
  const { state } = useApp();
  if (state.toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-5 right-5 z-[90] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {state.toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
