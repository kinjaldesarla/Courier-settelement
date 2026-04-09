import { X } from "lucide-react";

export default function Drawer({ open, title, onClose, children }) {
  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={[
          "fixed right-0 top-0 z-50 h-full w-full max-w-2xl transform border-l border-slate-200/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,247,252,0.98))] shadow-2xl transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-950">{title}</div>
            <div className="text-xs text-slate-500">Settlement discrepancy detail</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-72px)] overflow-auto px-5 py-5">{children}</div>
      </div>
    </>
  );
}
