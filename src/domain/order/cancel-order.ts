import { StoredOrder } from './order';

export type CancelDecision =
  { outcome: 'not-found' } | { outcome: 'conflict' } | { outcome: 'cancel' };

export function decideCancel(
  order: StoredOrder | null,
  userId: number,
): CancelDecision {
  if (!order || order.userId !== userId) {
    return { outcome: 'not-found' };
  }
  if (order.status !== 'NEW') {
    return { outcome: 'conflict' };
  }
  return { outcome: 'cancel' };
}
