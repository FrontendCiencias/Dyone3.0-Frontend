import React, { useMemo, useState } from "react";

function defaultGetOptionKey(option, index) {
  return option?.id || option?._id || option?.value || index;
}

function defaultRenderOption(option) {
  return option?.label || "Sin etiqueta";
}

export default function SearchSelect({
  label,
  value,
  onChange,
  placeholder = "Buscar...",
  disabled = false,
  options = [],
  onSelect,
  getOptionKey = defaultGetOptionKey,
  renderOption = defaultRenderOption,
  emptyText = "Sin resultados.",
  minChars = 2,
  isLoading = false,
  className = "",
  inputClassName = "",
  panelClassName = "",
}) {
  const [isFocused, setIsFocused] = useState(false);

  const normalizedValue = String(value || "").trim();
  const canSearch = normalizedValue.length >= minChars;
  const hasOptions = Array.isArray(options) && options.length > 0;

  const shouldShowPanel = useMemo(
    () => isFocused && canSearch && (hasOptions || isLoading || Boolean(emptyText)),
    [isFocused, canSearch, hasOptions, isLoading, emptyText],
  );

  return (
    <div className={`relative ${className}`}>
      {label ? <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label> : null}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100 ${inputClassName}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
      />

      {shouldShowPanel ? (
        <div className={`absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-xl ${panelClassName}`}>
          {hasOptions
            ? options.map((option, index) => (
                <button
                  key={getOptionKey(option, index)}
                  type="button"
                  className="mb-1 w-full rounded-md border border-transparent px-3 py-2 text-left text-sm hover:border-gray-200 hover:bg-gray-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect?.(option)}
                >
                  {renderOption(option)}
                </button>
              ))
            : null}

          {!hasOptions && isLoading ? <p className="px-1 py-2 text-sm text-gray-500">Buscando...</p> : null}
          {!hasOptions && !isLoading ? <p className="px-1 py-2 text-sm text-gray-500">{emptyText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
