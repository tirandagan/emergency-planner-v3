// Shared Google Maps configuration
// This ensures both MapComponent and LocationAutocomplete use the same libraries
// to avoid "Loader must not be called again with different options" error

export const GOOGLE_MAPS_LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

