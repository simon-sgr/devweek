import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Priority } from "./types";

type PrioritySelectProps = {
  value: Priority;
  onChange: (value: Priority) => void;
};

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function PrioritySelect({
  value,
  onChange,
}: PrioritySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () =>
      PRIORITY_OPTIONS.find((option) => option.value === value) ??
      PRIORITY_OPTIONS[0],
    [value],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`priority-picker priority-picker--${value} ${isOpen ? "priority-picker--open" : ""}`}
    >
      <button
        type="button"
        className="priority-picker__trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="priority-picker__left">
          <span
            className="priority-picker__dot priority-picker__dot--selected"
            aria-hidden="true"
          />
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown
          size={14}
          className="priority-picker__chevron"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <ul
          className="priority-picker__menu"
          role="listbox"
          aria-label="Priority"
        >
          {PRIORITY_OPTIONS.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
            >
              <button
                type="button"
                className={`priority-picker__option priority-picker__option--${option.value} ${option.value === value ? "priority-picker__option--active" : ""}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="priority-picker__dot" aria-hidden="true" />
                <span>{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
