import { describe, expect, it } from 'vitest'
import { resolveRouteTransition, routeTransitionDurationMs } from './routeTransition'

describe('resolveRouteTransition', () => {
  it('retourne none entre dossiers sidebar du même module', () => {
    expect(resolveRouteTransition('/factures/inbox', '/factures/envoyes')).toBe('none')
    expect(resolveRouteTransition('/devis/inbox', '/devis/brouillons')).toBe('none')
    expect(resolveRouteTransition('/clients/inbox', '/clients/actifs')).toBe('none')
  })

  it('retourne soft dans le même module hors changement de dossier', () => {
    expect(resolveRouteTransition('/factures/inbox', '/factures/voir/abc1234567')).toBe('soft')
    expect(resolveRouteTransition('/factures/archives', '/factures/inbox')).toBe('soft')
  })

  it('retourne full entre modules différents', () => {
    expect(resolveRouteTransition('/factures/inbox', '/devis/inbox')).toBe('full')
    expect(resolveRouteTransition('/dashboard', '/clients/inbox')).toBe('full')
  })

  it('adapte la durée à la transition', () => {
    expect(routeTransitionDurationMs('none')).toBe(0)
    expect(routeTransitionDurationMs('soft')).toBeGreaterThan(0)
    expect(routeTransitionDurationMs('full')).toBeGreaterThan(routeTransitionDurationMs('soft'))
  })
})
