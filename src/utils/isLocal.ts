// Determine whether running in local development environment
// - Bun: Local development environment
export function isLocal(): boolean {
  // @ts-ignore - Bun is a global in Bun runtime
  return typeof Bun !== 'undefined';
}
