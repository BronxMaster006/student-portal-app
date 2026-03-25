"use client";

type ToastProps = {
  message: string;
  type: "success" | "error";
};

export function Toast({ message, type }: ToastProps) {
  const tone = type === "success" ? "border-emerald-500/40 text-emerald-300" : "border-red-500/40 text-red-300";

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${tone}`}>
      {message}
    </div>
  );
}
