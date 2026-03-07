/* Minimal types for Google Maps Places Autocomplete (loaded via script) */
declare namespace google {
  namespace maps {
    namespace places {
      interface AutocompleteOptions {
        componentRestrictions?: { country: string | string[] };
        fields?: string[];
        types?: string[];
      }
      interface PlaceResult {
        formatted_address?: string;
        address_components?: unknown[];
      }
      class Autocomplete {
        constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
        getPlace(): PlaceResult;
        addListener(eventName: string, handler: () => void): void;
      }
    }
  }
}
