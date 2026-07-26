"use client";

import { Check, ChevronDown, X } from "lucide-react";
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
  SelectHTMLAttributes<HTMLSelectElement> & { clearable?: boolean }
>(function Select(
  {
    className,
    children,
    value,
    defaultValue,
    onChange,
    disabled,
    id,
    clearable = false,
    ...props
  },
  _ref,
) {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;
  const options = collectOptions(children);
  const selectedValue = String(value ?? defaultValue ?? "");
  const placeholderOption = options.find(
    (option) => option.value === "" || option.disabled,
  );
  const selectedOption =
    options.find((option) => option.value === selectedValue && option.value !== "") ??
    (selectedValue === "" ? placeholderOption : undefined) ??
    options.find((option) => option.value === selectedValue) ??
    placeholderOption;

  return (
    <PortalSelect
      selectId={selectId}
      className={className}
      options={options}
      value={selectedValue}
      selectedLabel={selectedOption?.label ?? "Select an option"}
      onChange={onChange}
      disabled={disabled}
      clearable={clearable}
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
  clearable,
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
  clearable?: boolean;
  required?: boolean;
  name?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [canPortal, setCanPortal] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: undefined as number | undefined,
    bottom: undefined as number | undefined,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const margin = 8;
    const preferredMaxHeight = 240;
    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(preferredMaxHeight, availableSpace - 4),
    );

    setMenuPosition({
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? viewportHeight - rect.top + 4 : undefined,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();
    triggerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.visualViewport?.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.visualViewport?.removeEventListener("resize", handleReposition);
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
    const option = options.find((item) => item.value === nextValue);
    if (option?.disabled && !(clearable && nextValue === "")) return;

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

  const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!value) return;
    onChange?.({
      target: { value: "" },
      currentTarget: { value: "" },
    } as ChangeEvent<HTMLSelectElement>);
  };

  const placeholderOption = options.find(
    (option) => option.value === "" || option.disabled,
  );
  const menuOptions =
    clearable && value
      ? [
          {
            value: "",
            label: placeholderOption?.label ?? "Clear selection",
          },
          ...options.filter((option) => option.value !== ""),
        ]
      : options;

  const menu =
    open &&
    canPortal &&
    createPortal(
      <>
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[10000] bg-transparent"
          onClick={() => setOpen(false)}
        />
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="fixed z-[10001] overflow-y-auto overscroll-contain border border-white/10 bg-zinc-950 py-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: menuPosition.width,
            minWidth: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
          }}
        >
          {menuOptions.map((option) => {
            const isSelected = option.value === value;
            const isPlaceholder = option.value === "";

            return (
              <li key={option.value || "__clear__"} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={option.disabled && !(clearable && isPlaceholder)}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-jackals-red/15 text-jackals-red-light"
                      : isPlaceholder
                        ? "text-zinc-400 hover:bg-white/5"
                        : "text-zinc-200 hover:bg-white/5",
                    option.disabled &&
                      !(clearable && isPlaceholder) &&
                      "cursor-not-allowed opacity-50",
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
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : required ? (
        <input
          type="text"
          value={value}
          required
          readOnly
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onChange={() => {}}
        />
      ) : null}
      <div className="relative">
        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-required={required}
          onClick={(event) => {
            event.stopPropagation();
            if (disabled) return;
            setOpen((current) => !current);
          }}
          className={cn(
            fieldClassName,
            "flex w-full items-center justify-between gap-2 text-left",
            clearable && value && "pr-10",
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
        {clearable && value ? (
          <button
            type="button"
            disabled={disabled}
            aria-label="Clear selection"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
      {menu}
    </>
  );
}
