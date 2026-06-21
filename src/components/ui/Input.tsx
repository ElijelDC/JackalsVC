import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";
import { fieldClassName } from "@/components/ui/field-styles";

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

export { Select, Textarea, Checkbox } from "@/components/ui/InputFields";
