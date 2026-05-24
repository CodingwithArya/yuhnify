"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getInjuryDisplayLabel,
  isCuratedInjuryId,
  searchInjuryOptions,
} from "@/lib/injury-options";

interface InjuryAutocompleteProps {
  value: string[];
  onChange: (injuries: string[]) => void;
  disabled?: boolean;
  showHelperText?: boolean;
}

async function validateCustomInjury(text: string): Promise<{
  valid: boolean;
  message?: string;
}> {
  try {
    const response = await fetch("/api/validate-input", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, type: "injury" }),
    });

    if (!response.ok) {
      console.warn("Injury validation API unavailable, allowing input through.");
      return { valid: true };
    }

    return (await response.json()) as { valid: boolean; message?: string };
  } catch (error) {
    console.warn("Injury validation failed, allowing input through:", error);
    return { valid: true };
  }
}

export function InjuryAutocomplete({
  value,
  onChange,
  disabled = false,
  showHelperText = true,
}: InjuryAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const matches = useMemo(
    () => searchInjuryOptions(query, selectedSet),
    [query, selectedSet]
  );

  const trimmedQuery = query.trim();
  const showCustomOption =
    trimmedQuery.length > 0 &&
    !matches.some(
      (option) =>
        option.label.toLowerCase() === trimmedQuery.toLowerCase() ||
        option.id === trimmedQuery
    ) &&
    !value.some(
      (entry) => entry.toLowerCase() === trimmedQuery.toLowerCase()
    );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSelection = useCallback(
    (entry: string) => {
      const normalized = entry.trim();
      if (!normalized || selectedSet.has(normalized)) return;
      if (
        value.some(
          (existing) => existing.toLowerCase() === normalized.toLowerCase()
        )
      ) {
        return;
      }
      onChange([...value, normalized]);
      setQuery("");
      setError(null);
      setOpen(false);
      inputRef.current?.focus();
    },
    [onChange, selectedSet, value]
  );

  async function addCustomEntry(text: string) {
    const normalized = text.trim();
    if (!normalized || disabled || validating) return;

    setValidating(true);
    setError(null);

    const result = await validateCustomInjury(normalized);
    setValidating(false);

    if (!result.valid) {
      setError(result.message ?? "This input is not allowed.");
      return;
    }

    addSelection(normalized);
  }

  function handleSelectCurated(id: string) {
    if (disabled) return;
    addSelection(id);
  }

  function handleRemove(entry: string) {
    if (disabled) return;
    onChange(value.filter((item) => item !== entry));
  }

  function handleInputChange(next: string) {
    setQuery(next);
    setError(null);
    setOpen(true);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (matches.length > 0) {
        handleSelectCurated(matches[0].id);
        return;
      }
      if (showCustomOption) {
        void addCustomEntry(trimmedQuery);
      }
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown =
    open && !disabled && (matches.length > 0 || showCustomOption);

  return (
    <div ref={containerRef} className="space-y-3">
      {showHelperText && (
        <p className="text-sm text-[#71717a]">
          This helps your coach avoid aggravating anything
        </p>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled || validating}
          placeholder="Search or describe an injury..."
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316] disabled:opacity-50"
        />

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {matches.map((option) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelectCurated(option.id)}
                className="w-full text-left text-sm py-2 px-3 hover:bg-zinc-800 text-white"
              >
                {option.label}
              </button>
            ))}

            {showCustomOption && (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void addCustomEntry(trimmedQuery)}
                className="w-full text-left text-sm py-2 px-3 hover:bg-zinc-800 text-[#f97316] italic border-t border-zinc-700"
              >
                Add &apos;{trimmedQuery}&apos; as custom
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((entry) => (
            <span
              key={entry}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-zinc-800 border border-zinc-600 text-white"
            >
              {getInjuryDisplayLabel(entry)}
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${getInjuryDisplayLabel(entry)}`}
                  onClick={() => handleRemove(entry)}
                  className="text-[#f97316] hover:text-orange-400 leading-none"
                >
                  x
                </button>
              )}
              {!isCuratedInjuryId(entry) && (
                <span className="text-[10px] text-[#71717a] uppercase tracking-wide">
                  custom
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
