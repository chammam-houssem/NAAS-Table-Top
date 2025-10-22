import { ActionNode } from '../schema/index.js';

export function computeCompleteness(node: ActionNode): number {
  let score = 0;
  if (node.authorizers.length > 0) score += 20;
  if (node.isEndToEndOnline) score += 15;
  if (node.legalBases.length > 0) score += 20;
  if (node.rulesToFollow.length > 0) score += 20;
  if (node.abuseExamples.length > 0) score += 15;
  if (node.summary.trim().length > 0) score += 10;
  return Math.min(score, 100);
}

export function completenessColor(score: number): string {
  if (score >= 80) return '#15803d';
  if (score >= 60) return '#ca8a04';
  return '#b91c1c';
}
