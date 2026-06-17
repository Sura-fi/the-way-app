export const OTHER_KEY = "Other";
export const OTHER_PREFIX = "Other:";
export const MAX_OTHER_LENGTH = 80;

export function isOtherEntry(s: string): boolean {
  return s === OTHER_KEY || s.startsWith(OTHER_PREFIX);
}

export function getOtherText(selections: string[]): string {
  const entry = selections.find(isOtherEntry);
  if (!entry) return "";
  return entry.startsWith(OTHER_PREFIX) ? entry.slice(OTHER_PREFIX.length) : "";
}

// Removes an "Other:" entry that has no text, so a blank custom entry never
// counts as a selection when the user confirms.
export function stripEmptyOther(selections: string[]): string[] {
  return selections.filter((s) => !(isOtherEntry(s) && getOtherTextOf(s).length === 0));
}

function getOtherTextOf(s: string): string {
  if (s.startsWith(OTHER_PREFIX)) return s.slice(OTHER_PREFIX.length);
  if (s === OTHER_KEY) return "";
  return s;
}
