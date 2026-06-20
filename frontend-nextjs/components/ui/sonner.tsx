"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      style={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-background text-foreground border-border border-2 font-heading shadow-shadow rounded-base text-sm flex items-start gap-3 p-4 w-[400px] [&:has(button)]:justify-between",
          title: "font-heading text-sm leading-tight",
          description:
            "font-base text-sm leading-snug text-foreground/80 mt-1 break-words",
          actionButton:
            "font-base border-2 text-xs h-7 px-3 bg-main text-main-foreground border-border rounded-base shrink-0",
          cancelButton:
            "font-base border-2 text-xs h-7 px-3 bg-secondary-background text-foreground border-border rounded-base shrink-0",
          error: "bg-black text-white",
          success: "bg-main text-main-foreground border-border",
          warning: "bg-secondary-background text-foreground",
          info: "bg-background text-foreground",
          loading:
            "[&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:flex-shrink-0 [&[data-sonner-toast]_[data-icon]]:mt-0.5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
