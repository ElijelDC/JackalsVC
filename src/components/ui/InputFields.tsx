import { cn } from "@/lib/utils";
import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";
import { fieldClassName } from "@/components/ui/field-styles";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClassName, className)} {...props}>
    {children}
  </select>
));

Select.displayName = "Select";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldClassName, "placeholder:text-zinc-600", className)}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, checked, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    checked={checked ?? false}
    className={cn("h-4 w-4 accent-jackals-red", className)}
    {...props}
  />
));

Checkbox.displayName = "Checkbox";
