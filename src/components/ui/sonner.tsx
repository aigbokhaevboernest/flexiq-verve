import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      closeButton
      richColors
      duration={4000}
      visibleToasts={5}
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-xl border-2 shadow-2xl backdrop-blur-sm font-sans",
          title: "font-semibold text-sm",
          description: "text-sm opacity-90",
          success:
            "!bg-green-600 !text-white !border-green-700 [&>button]:!text-white",
          error:
            "!bg-red-600 !text-white !border-red-700 [&>button]:!text-white",
          info:
            "!bg-blue-600 !text-white !border-blue-700 [&>button]:!text-white",
          warning:
            "!bg-amber-500 !text-white !border-amber-600 [&>button]:!text-white",
          closeButton: "!bg-transparent !border-0 hover:!opacity-70",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
