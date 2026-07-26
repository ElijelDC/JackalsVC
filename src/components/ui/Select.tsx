"use client";

import { Check, ChevronDown, ChevronsDown, X } from "lucide-react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollHints, setScrollHints] = useState({
    canScrollUp: false,
    canScrollDown: false,
    isScrollable: false,
  });
  const [menuPosition, setMenuPosition] = useState({
    top: undefined as number | undefined,
    bottom: undefined as number | undefined,
    left: 0,
    width: 0,
    maxHeight: 240,
  });

  const updateMenuPosition = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
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

  const updateScrollHints = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const isScrollable = list.scrollHeight > list.clientHeight + 1;
    setScrollHints({
      isScrollable,
      canScrollUp: list.scrollTop > 4,
      canScrollDown: list.scrollTop + list.clientHeight < list.scrollHeight - 4,
    });
  }, []);

  useEffect(() => {
    setCanPortal(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    updateMenuPosition();
    containerRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });

    const handleReposition = () => {
      updateMenuPosition();
      window.requestAnimationFrame(() => updateScrollHints());
    };
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    window.visualViewport?.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
      window.visualViewport?.removeEventListener("resize", handleReposition);
    };
  }, [open, updateMenuPosition, updateScrollHints]);

  useEffect(() => {
    if (!open) {
      setScrollHints({
        canScrollUp: false,
        canScrollDown: false,
        isScrollable: false,
      });
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = 0;
      updateScrollHints();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, options.length, value, clearable, menuPosition.maxHeight, updateScrollHints]);

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
    event.preventDefault();
    event.stopPropagation();
    if (!value) return;
    setOpen(false);
    onChange?.({
      target: { value: "" },
      currentTarget: { value: "" },
    } as ChangeEvent<HTMLSelectElement>);
  };

  const showClearButton = clearable && Boolean(value);

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
        <div
          className="fixed z-[10001] overflow-hidden border border-white/10 bg-zinc-950 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{
            top: menuPosition.top,
            bottom: menuPosition.bottom,
            left: menuPosition.left,
            width: menuPosition.width,
            minWidth: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
          }}
        >
          {scrollHints.canScrollUp ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-7 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-transparent"
            />
          ) : null}
          <ul
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            onScroll={updateScrollHints}
            className={cn(
              "max-h-[inherit] overflow-y-auto overscroll-contain py-1",
              "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.28)_transparent]",
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25",
              scrollHints.isScrollable &&
                scrollHints.canScrollDown &&
                "pb-10",
            )}
            style={{ maxHeight: menuPosition.maxHeight }}
          >
            {menuOptions.map((option) => {
              const isSelected = option.value === value;
              const isPlaceholder = option.value === "";

              return (
                <li
                  key={option.value || "__clear__"}
                  role="option"
                  aria-selected={isSelected}
                >
                  <button
                    type="button"
                    disabled={option.disabled && !(clearable && isPlaceholder)}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
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
          {scrollHints.canScrollDown ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent px-3 pb-2 pt-8"
            >
              <ChevronsDown className="h-4 w-4 animate-bounce text-zinc-400" />
              <span className="mt-0.5 text-[11px] font-medium tracking-wide text-zinc-400">
                Scroll for more
              </span>
            </div>
          ) : null}
        </div>
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
      <div ref={containerRef} className="flex w-full">
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
            "flex min-w-0 flex-1 items-center justify-between gap-2 text-left",
            showClearButton && "rounded-r-none border-r-0 pr-3",
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
        {showClearButton ? (
          <button
            type="button"
            disabled={disabled}
            aria-label="Clear selection"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={handleClear}
            className="flex w-11 shrink-0 touch-manipulation items-center justify-center border border-white/10 border-l-0 bg-jackals-inset text-zinc-400 transition-colors hover:bg-white/5 hover:text-white focus:border-jackals-red focus:outline-none focus:ring-1 focus:ring-jackals-red"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>
      {menu}
    </>
  );
}
