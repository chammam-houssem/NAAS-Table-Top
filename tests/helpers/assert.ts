export function equal(actual: unknown, expected: unknown, message?: string) {
  if (actual !== expected) {
    throw new Error(message ?? `Assertion failed: expected ${expected}, received ${actual}`);
  }
}

export function ok(value: unknown, message?: string) {
  if (!value) {
    throw new Error(message ?? 'Assertion failed: value is falsy');
  }
}

export async function rejects(fn: () => Promise<unknown>, message?: string) {
  try {
    await fn();
  } catch {
    return;
  }
  throw new Error(message ?? 'Assertion failed: expected rejection');
}
