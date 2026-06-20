import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

const fieldClassName =
  "w-full border border-white/10 bg-jackals-inset px-4 py-2.5 text-sm text-white focus:border-jackals-red focus:outline-none focus:ring-1 focus:ring-jackals-red";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(fieldClassName, "placeholder:text-zinc-600", className)}
    {...props}
  />
));

Input.displayName = "Input";

export const Label = ({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn("mb-1.5 block text-sm font-medium text-zinc-400", className)}
    {...props}
  >
    {children}
  </label>
);
