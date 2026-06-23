"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  forwardRef,
} from "react";
import { createPortal } from "react-dom";
import { fieldClassName } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function collectOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;

    const element = child as ReactElement<{
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    }>;

    if (element.type === "option") {
      options.push({
        value: String(element.props.value ?? ""),
        label: String(element.props.children ?? ""),
        disabled: element.props.disabled,
      });
      return;
    }

    if (element.type === "optgroup") {
      Children.forEach(element.props.children, (groupChild) => {
        if (!isValidElement(groupChild)) return;
        const option = groupChild as ReactElement<{
          value?: string | number;
          disabled?: boolean;
          children?: ReactNode;
        }>;
        if (option.type !== "option") return;
        options.push({
          value: String(option.props.value ?? ""),
          label: String(option.props.children ?? ""),
          disabled: option.props.disabled,
        });
      });
    }
  });

  return options;
}

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select(
  { className, children, value, defaultValue, onChange, disabled, id, ...props },
  _ref,
) {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;
  const options = collectOptions(children);
  const selectedValue = String(value ?? defaultValue ?? options[0]?.value ?? "");
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0];

  return (
    <PortalSelect
      selectId={selectId}
      className={className}
      options={options}
      value={selectedValue}
      selectedLabel={selectedOption?.label ?? "Select"}
      onChange={onChange}
      disabled={disabled}
      aria-label={props["aria-label"]}
      required={props.required}
      name={props.name}
    />
  );
});

Select.displayName = "Select";

function PortalSelect({
  selectId,
  className,
  options,
  value,
  selectedLabel,
  onChange,
  disabled,
  required,
  name,
  "aria-label": ariaLabel,
}: {
  selectId: string;
  className?: string;
  options: SelectOption[];
  value: string;
  selectedLabel: string;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>["onChange"];
  disabled?: boolean;
  required?: boolean;
  name?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();

    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSelect = (nextValue: string) => {
    if (nextValue === value) {
      setOpen(false);
      return;
    }

    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  };

  const menu =
    open &&
    canPortal &&
    createPortal(
      <>
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[200] bg-transparent"
          onClick={() => setOpen(false)}
        />
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="fixed z-[201] max-h-60 overflow-y-auto overscroll-contain border border-white/10 bg-zinc-950 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            minWidth: menuPosition.width,
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-jackals-red/15 text-jackals-red-light"
                      : "text-zinc-200 hover:bg-white/5",
                    option.disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </>,
      document.body,
    );

  return (
    <>
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={cn(
          fieldClassName,
          "flex items-center justify-between gap-2 text-left",
          className,
        )}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {menu}
    </>
  );
}
