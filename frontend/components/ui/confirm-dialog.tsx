"use client";

import React from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B38]/65 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white border border-[#EAE5DB] p-6 shadow-xl space-y-4">
        <div>
          <h3
            id="confirm-dialog-title"
            className="font-serif text-xl font-semibold text-[#172B38]"
          >
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-[#303437] leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#EAE5DB] bg-[#F6F4EF] hover:bg-[#EAE5DB]/60 disabled:opacity-50 text-[#303437] text-xs font-semibold transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 transition ${
              variant === "danger"
                ? "bg-rose-700 hover:bg-rose-600 text-white"
                : "bg-[#172B38] hover:bg-[#213B4D] text-[#EAE5DB] border border-[#C9B58E]/30"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
