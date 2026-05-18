const subscribers = new Set<() => void>();

export function subscribeToSessionExpired(handler: () => void): () => void {
  subscribers.add(handler);
  return () => subscribers.delete(handler);
}

export function notifySessionExpired(): void {
  for (const handler of subscribers) handler();
}
