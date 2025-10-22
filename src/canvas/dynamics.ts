export interface Arena {
  initialWidth: number;
  initialHeight: number;
}

export function expandArenaIfNeeded(arena: Arena, outgoingLinks: number): Arena {
  if (outgoingLinks <= 6) return arena;
  const multiplier = Math.min(outgoingLinks - 5, 4);
  return {
    initialWidth: arena.initialWidth + 200 * multiplier,
    initialHeight: arena.initialHeight + 200 * multiplier,
  };
}
