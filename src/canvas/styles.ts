import { LinkType } from '../schema/index.js';

export const linkStyles: Record<LinkType, { color: string; dash: string; width: number }> = {
  AUTHORIZES: { color: '#2563eb', dash: '', width: 2 },
  REQUIRES: { color: '#7c3aed', dash: '4 2', width: 2 },
  GOVERNED_BY: { color: '#0f766e', dash: '2 4', width: 3 },
  FUNDED_BY: { color: '#9333ea', dash: '', width: 3 },
  ENABLED_BY_PPP: { color: '#dc2626', dash: '6 4', width: 3 },
  REGULATED_BY: { color: '#0891b2', dash: '4 4', width: 2 },
  ABUSES_REPORTED: { color: '#f97316', dash: '2 6', width: 3 },
  INFORMATION_FLOW: { color: '#0ea5e9', dash: '2 2', width: 2 },
  ENFORCES: { color: '#15803d', dash: '', width: 4 },
  DUPLICATES: { color: '#a855f7', dash: '1 4', width: 2 },
  DEPENDS_ON: { color: '#ea580c', dash: '3 3', width: 3 },
};
