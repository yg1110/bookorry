"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Props {
  srcs: string[];
  index: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}

export function ImageLightbox({ srcs, index, onClose, onChangeIndex }: Props) {
  const total = srcs.length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index > 0) onChangeIndex(index - 1);
      if (e.key === "ArrowRight" && index < total - 1) onChangeIndex(index + 1);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onChangeIndex, index, total]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
      >
        <X size={20} />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onChangeIndex(index - 1); }}
          className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onChangeIndex(index + 1); }}
          className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <ChevronRight size={24} />
        </button>
      )}

      <img
        src={srcs[index]}
        alt=""
        className="max-h-screen max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <div className="absolute bottom-5 flex gap-1.5">
          {srcs.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onChangeIndex(i); }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
