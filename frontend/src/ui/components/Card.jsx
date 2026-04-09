import clsx from "clsx";

export default function Card({ className, children }) {
  return (
    <div className={clsx("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}
