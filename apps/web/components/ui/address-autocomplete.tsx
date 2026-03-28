"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Bootstrap loader sets up google.maps.importLibrary (Maps JavaScript API dynamic loading).
// See: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
const BOOTSTRAP_SCRIPT_ID = "google-maps-bootstrap";

type MapsWithLoader = { importLibrary?: (name: string) => Promise<unknown> };

function loadMapsBootstrap(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Window undefined"));

  const existing = document.getElementById(BOOTSTRAP_SCRIPT_ID);
  if (existing) {
    const maps = (window as { google?: { maps?: MapsWithLoader } }).google?.maps;
    if (maps?.importLibrary) return Promise.resolve();
    return new Promise((resolve) => {
      const check = () => {
        const m = (window as { google?: { maps?: MapsWithLoader } }).google?.maps;
        if (m?.importLibrary) resolve();
        else requestAnimationFrame(check);
      };
      check();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = BOOTSTRAP_SCRIPT_ID;
    script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src="https://maps."+c+"apis.com/maps/api/js?"+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:"${apiKey.replace(/"/g, '\\"')}",v:"weekly"});`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps bootstrap"));
    document.head.appendChild(script);
  });
}

export interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

/** @deprecated Use loadMapsBootstrap + importLibrary('places') for Places API (New). */
export function loadGooglePlacesScript(apiKey: string): Promise<void> {
  return loadMapsBootstrap(apiKey).then(() => {
    const maps = (window as { google?: { maps?: MapsWithLoader } }).google?.maps;
    if (!maps?.importLibrary) throw new Error("importLibrary not available");
    return maps.importLibrary("places") as Promise<unknown>;
  }).then(() => undefined);
}

const AU_REGION = "au";
const DEBOUNCE_MS = 200;

/** Strip ", Australia" from the end of addresses (all clients are Australia-based). */
function dropCountrySuffix(address: string): string {
  return (address ?? "").replace(/,?\s*Australia\s*$/i, "").trim();
}

type AddressComponentLike = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type PlaceLike = {
  formattedAddress?: string;
  addressComponents?: AddressComponentLike[] | Iterable<AddressComponentLike>;
  postalAddress?: { postalCode?: string };
};

/** Extract postcode from addressComponents or direct postalCode (e.g. from place.postalAddress). */
function getPostcode(
  addressComponents?: AddressComponentLike[],
  directPostalCode?: string
): string {
  const fromDirect = (directPostalCode ?? "").trim();
  if (fromDirect) return fromDirect;
  const postal = addressComponents?.find((c) => c.types?.includes("postal_code"));
  return (postal?.longText ?? postal?.shortText ?? "").trim();
}

/** Append postcode to address if we have it and it's not already at the end. */
function withPostcode(
  address: string,
  opts?: { addressComponents?: AddressComponentLike[]; postalCode?: string }
): string {
  const base = dropCountrySuffix(address);
  const postcode = getPostcode(opts?.addressComponents, opts?.postalCode);
  if (!postcode) return base;
  const trimmed = base.trim();
  if (trimmed.endsWith(postcode)) return trimmed;
  return `${trimmed} ${postcode}`.trim();
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Type or select an address in Australia",
  className,
  id,
  disabled,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; text: string }>>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const sessionTokenRef = useRef<unknown>(null);
  const suggestionsRef = useRef<Array<{ placePrediction: { toPlace: () => Promise<{ fetchFields: (opts: { fields: string[] }) => Promise<{ formattedAddress?: string }> }>; placeId: string; text?: { text?: string } } }>>([]);
  /** Mirrors `suggestions` so selection always sees the latest rows (async fetch may not re-run parent). */
  const latestSuggestionsDisplayRef = useRef(suggestions);
  latestSuggestionsDisplayRef.current = suggestions;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionRequestIdRef = useRef(0);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || !window.google?.maps?.places) {
      setSuggestions([]);
      suggestionsRef.current = [];
      setOpen(false);
      return;
    }
    const g = window.google as unknown as {
      maps: {
        places: {
          AutocompleteSessionToken: new () => unknown;
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: (req: {
              input: string;
              sessionToken?: unknown;
              includedRegionCodes?: string[];
            }) => Promise<{ suggestions: Array<{ placePrediction: { toPlace: () => Promise<{ fetchFields: (opts: { fields: string[] }) => Promise<{ formattedAddress?: string }> }>; placeId: string; text?: { text?: string } } }> }>;
          };
        };
      };
    };
    const places = g.maps.places;
    let token = sessionTokenRef.current;
    if (!token) {
      token = new places.AutocompleteSessionToken();
      sessionTokenRef.current = token;
    }
    try {
      const { suggestions: list } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: input.trim(),
        sessionToken: token,
        includedRegionCodes: [AU_REGION],
      });
      const items = list ?? [];
      suggestionsRef.current = items;
      const requestId = ++suggestionRequestIdRef.current;
      const initialSuggestions = items.map((s) => ({
        placeId: s.placePrediction?.placeId ?? "",
        text: dropCountrySuffix(s.placePrediction?.text?.text ?? ""),
      }));
      setSuggestions(initialSuggestions);
      setHighlightIndex(-1);
      setOpen(items.length > 0);

      // Enrich dropdown with postcodes in the background (Place Details per suggestion)
      items.forEach((item, index) => {
        const placePrediction = item.placePrediction;
        if (!placePrediction?.toPlace) return;
        void (async () => {
          try {
            const place = await placePrediction.toPlace();
            await Promise.resolve(
              place.fetchFields({
                fields: ["formattedAddress", "addressComponents", "postalAddress"],
              })
            );
            const pl = place as unknown as PlaceLike;
            const formatted = pl.formattedAddress;
            if (!formatted) return;
            const components = pl.addressComponents;
            const arr = Array.isArray(components) ? components : components ? Array.from(components) : undefined;
            const postalCode = pl.postalAddress?.postalCode;
            const textWithPostcode = withPostcode(formatted, { addressComponents: arr, postalCode });
            setSuggestions((prev) => {
              if (suggestionRequestIdRef.current !== requestId || !prev[index]) return prev;
              const next = [...prev];
              const current = next[index]!;
              next[index] = { placeId: current.placeId, text: textWithPostcode };
              return next;
            });
          } catch {
            // ignore enrichment errors
          }
        })();
      });
    } catch {
      setSuggestions([]);
      suggestionsRef.current = [];
      setOpen(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      onChange(v);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!scriptReady) return;
      debounceRef.current = setTimeout(() => fetchSuggestions(v), DEBOUNCE_MS);
    },
    [onChange, scriptReady, fetchSuggestions]
  );

  const selectSuggestion = useCallback(
    async (index: number) => {
      const list = suggestionsRef.current;
      const display = latestSuggestionsDisplayRef.current[index];
      setSuggestions([]);
      suggestionsRef.current = [];
      setOpen(false);
      sessionTokenRef.current = null;
      if (!display) return;
      onChange(display.text);
      const raw = list?.[index]?.placePrediction;
      if (!raw?.toPlace) return;
      try {
        const place = await raw.toPlace();
        await Promise.resolve(
          place.fetchFields({
            fields: ["formattedAddress", "addressComponents", "postalAddress"],
          })
        );
        const pl = place as unknown as PlaceLike;
        const formatted = pl.formattedAddress;
        if (!formatted) return;
        const components = pl.addressComponents;
        const arr = Array.isArray(components) ? components : components ? Array.from(components) : undefined;
        const postalCode = pl.postalAddress?.postalCode;
        const final = withPostcode(formatted, { addressComponents: arr, postalCode });
        onChange(final);
      } catch {
        // keep display.text
      }
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || suggestions.length === 0) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => (i < suggestions.length - 1 ? i + 1 : i));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
      } else if (e.key === "Enter" && highlightIndex >= 0 && suggestions[highlightIndex]) {
        e.preventDefault();
        selectSuggestion(highlightIndex);
      } else if (e.key === "Escape") {
        setOpen(false);
        setHighlightIndex(-1);
      }
    },
    [open, suggestions, highlightIndex, selectSuggestion]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!apiKey) return;
    loadMapsBootstrap(apiKey)
      .then(() => {
        const maps = (window as { google?: { maps?: MapsWithLoader } }).google?.maps;
        if (!maps?.importLibrary) throw new Error("importLibrary not available");
        return maps.importLibrary("places") as Promise<unknown>;
      })
      .then(() => setScriptReady(true))
      .catch(() => setScriptError(true));
  }, [apiKey]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const inputClassName = cn(
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:opacity-50",
    className
  );

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        name="places-address"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim() && scriptReady && fetchSuggestions(value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        className={inputClassName}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="address-suggestions"
        aria-activedescendant={highlightIndex >= 0 && suggestions[highlightIndex] ? `address-suggestion-${highlightIndex}` : undefined}
      />
      {open && suggestions.length > 0 && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-[10000] mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`address-suggestion-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              className={cn(
                "cursor-pointer px-4 py-2 text-sm text-slate-900 hover:bg-slate-100",
                i === highlightIndex && "bg-emerald-50 text-emerald-900"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(i);
              }}
            >
              {s.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
