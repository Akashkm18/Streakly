import sanitizeHtml from 'sanitize-html';

export function sanitizeText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

export function sanitizeOptionalText(input: string | undefined | null): string | undefined {
  if (input === undefined || input === null) return undefined;
  if (typeof input !== 'string') return '';
  const sanitized = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
  return sanitized.length > 0 ? sanitized : undefined;
}
