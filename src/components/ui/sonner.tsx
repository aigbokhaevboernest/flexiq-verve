import { Toaster as Sonner } from "sonner";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Glass toasts: colours come from your CSS tokens, so light/dark follow the
// `dark` class on <html> automatically (no theme provider needed).
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      duration={3500}
      visibleToasts={3}
      gap={10}
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        error: <XCircle className="h-5 w-5 text-rose-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        info: <Info className="h-5 w-5 text-sky-500" />,
        loading: <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background/85 p-4 font-sans text-foreground shadow-elev backdrop-blur-xl",
          icon: "mt-0.5 shrink-0",
          title: "text-sm font-semibold leading-snug",
          description: "mt-0.5 text-sm leading-snug text-muted-foreground",
          success: "!border-emerald-500/30",
          error: "!border-rose-500/30",
          warning: "!border-amber-500/30",
          info: "!border-sky-500/30",
          actionButton:
            "ml-auto rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground",
          cancelButton: "rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground",
          closeButton: "rounded-full border border-border/60 bg-background",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
