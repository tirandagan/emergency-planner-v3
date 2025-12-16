/**
 * Convert a string to a URL-friendly slug
 *
 * @param text - The text to convert to a slug
 * @returns URL-safe slug with lowercase letters, numbers, and dashes
 *
 * @example
 * slugify("Emergency Kit - Family Bundle!")
 * // Returns: "emergency-kit-family-bundle"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with dashes
    .replace(/\s+/g, '-')
    // Remove all non-word chars (except dashes)
    .replace(/[^\w\-]+/g, '')
    // Replace multiple dashes with single dash
    .replace(/\-\-+/g, '-')
    // Remove leading/trailing dashes
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
