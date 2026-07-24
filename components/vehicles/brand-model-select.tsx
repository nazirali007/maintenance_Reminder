"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon, CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CAR_BRANDS, findBrand } from "@/lib/car-catalog";
import { BrandIcon } from "@/components/vehicles/brand-icon";
import { FieldLabel } from "@/components/ui/field";

interface DropdownOption {
  name: string;
  icon?: React.ReactNode;
}

function Dropdown({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: DropdownOption[];
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );
  const selected = options.find((o) => o.name === value);

  return (
    <div ref={ref}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative mt-2">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm transition-colors",
            disabled
              ? "cursor-not-allowed text-muted-foreground/50"
              : "hover:border-primary/50",
            open && "border-primary ring-3 ring-primary/20"
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected?.icon}
            <span className={selected ? "" : "text-muted-foreground"}>
              {selected ? selected.name : placeholder}
            </span>
          </span>
          <ChevronDownIcon
            size={16}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && !disabled && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <SearchIcon size={14} className="text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No results
                </div>
              )}
              {filtered.map((o) => {
                const isSelected = o.name === value;
                return (
                  <button
                    key={o.name}
                    type="button"
                    onClick={() => {
                      onChange(o.name);
                      setQuery("");
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      isSelected && "bg-muted"
                    )}
                  >
                    {o.icon}
                    <span className="flex-1 truncate">{o.name}</span>
                    {isSelected && <CheckIcon size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandModelSelect({
  brand,
  model,
  onBrandChange,
  onModelChange,
}: {
  brand: string;
  model: string;
  onBrandChange: (name: string) => void;
  onModelChange: (name: string) => void;
}) {
  const selectedBrand = findBrand(brand);
  const models = selectedBrand ? selectedBrand.models : [];

  return (
    <>
      <div>
        <Dropdown
          id="brand"
          label="Brand"
          placeholder="Select brand"
          value={brand}
          onChange={(name) => {
            onBrandChange(name);
            onModelChange("");
          }}
          options={CAR_BRANDS.map((b) => ({
            name: b.name,
            icon: <BrandIcon brand={b.name} size={22} />,
          }))}
        />
      </div>

      <div>
        <Dropdown
          id="model"
          label="Model"
          placeholder={selectedBrand ? "Select model" : "Select a brand first"}
          value={model}
          onChange={onModelChange}
          disabled={!selectedBrand}
          options={models.map((m) => ({ name: m }))}
        />
      </div>

      {selectedBrand && model && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:col-span-2">
          <BrandIcon brand={selectedBrand.name} size={40} />
          <div>
            <p className="text-sm font-medium">
              {selectedBrand.name} {model}
            </p>
            <p className="text-xs text-muted-foreground">Selected vehicle</p>
          </div>
        </div>
      )}
    </>
  );
}
