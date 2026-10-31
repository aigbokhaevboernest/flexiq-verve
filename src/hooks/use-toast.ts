// Compatibility layer: every old `useToast()` / `toast({ title, variant })` call now
// renders through Sonner, so the whole app shows one premium toast style with no
// call-site edits. New code can import { toast } from "sonner" directly.
import type { ReactNode } from "react";
import { toast as sonner } from "sonner";

type ToastInput = {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

function toast({ title, description, variant, duration }: ToastInput) {
  const heading = (title ?? description ?? "") as string;
  const opts = { description: title ? description : undefined, duration } as any;
  const id =
    variant === "destructive"
      ? sonner.error(heading || "Something went wrong", opts)
      : sonner(heading, opts);
  return { id, dismiss: () => sonner.dismiss(id) };
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string | number) => sonner.dismiss(id),
    toasts: [] as any[],
  };
}

export { useToast, toast };
