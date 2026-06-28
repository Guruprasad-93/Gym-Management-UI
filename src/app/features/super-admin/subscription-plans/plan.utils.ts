export function slugifyPlanCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || 'PLAN';
}

export function clonePlanName(original: string): string {
  const trimmed = original.trim();
  return trimmed.endsWith(' Copy') ? `${trimmed} 2` : `${trimmed} Copy`;
}
