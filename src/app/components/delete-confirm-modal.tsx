"use client";

import { useState } from "react";
import Modal from "./modal";

export default function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  isDeleting,
  confirmLabel = "削除する",
  deletingLabel = "削除中...",
  requiresCheckbox = false,
  checkboxLabel = "理解した上で削除します",
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  confirmLabel?: string;
  deletingLabel?: string;
  requiresCheckbox?: boolean;
  checkboxLabel?: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const canDelete = requiresCheckbox ? confirmed : true;

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-sm text-foreground/60 mb-4">{message}</p>
      {requiresCheckbox && (
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="w-4 h-4 accent-red-500 cursor-pointer"
          />
          <span className="text-sm text-foreground/70">{checkboxLabel}</span>
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
        >
          キャンセル
        </button>
        <button
          onClick={onConfirm}
          disabled={!canDelete || isDeleting}
          className="flex-1 px-4 py-2 text-sm text-red-500 border border-foreground/10 rounded-lg hover:bg-foreground/5 disabled:opacity-30 cursor-pointer"
        >
          {isDeleting ? deletingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
