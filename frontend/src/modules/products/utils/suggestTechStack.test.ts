import { describe, expect, it } from 'vitest';
import { flattenTechStack } from '../../../types/techStack';
import { suggestTechStackFromClassification } from './suggestTechStack';

describe('suggestTechStackFromClassification', () => {
  it('propose PHP et WordPress pour un site vitrine', () => {
    const stack = suggestTechStackFromClassification({
      kind: 'SERVICE',
      purpose: 'SHOWCASE',
      category: '',
    });
    const flat = flattenTechStack(stack).map((s) => s.toLowerCase());
    expect(flat.some((s) => s.includes('php'))).toBe(true);
    expect(flat.some((s) => s.includes('wordpress'))).toBe(true);
  });

  it('propose React/NestJS pour SaaS', () => {
    const stack = suggestTechStackFromClassification({
      kind: 'SAAS',
      purpose: 'SAAS',
      category: 'DEV',
    });
    const flat = flattenTechStack(stack).map((s) => s.toLowerCase());
    expect(flat.some((s) => s.includes('react'))).toBe(true);
    expect(flat.some((s) => s.includes('nestjs'))).toBe(true);
  });
});
