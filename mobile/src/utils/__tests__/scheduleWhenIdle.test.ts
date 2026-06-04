import { scheduleWhenIdle } from '../scheduleWhenIdle'

describe('scheduleWhenIdle', () => {
  it('exécute immédiatement hors web', () => {
    const run = jest.fn()
    const cancel = scheduleWhenIdle(run, 'ios')
    expect(run).toHaveBeenCalledTimes(1)
    cancel()
  })

  it('diffère sur web via requestIdleCallback', () => {
    const run = jest.fn()
    const idle = jest.fn((cb: () => void) => {
      cb()
      return 42
    })
    const cancelIdle = jest.fn()
    ;(global as { requestIdleCallback?: typeof idle }).requestIdleCallback = idle
    ;(global as { cancelIdleCallback?: typeof cancelIdle }).cancelIdleCallback = cancelIdle

    const cancel = scheduleWhenIdle(run, 'web')
    expect(idle).toHaveBeenCalled()
    expect(run).toHaveBeenCalledTimes(1)

    cancel()
    expect(cancelIdle).toHaveBeenCalledWith(42)

    delete (global as { requestIdleCallback?: unknown }).requestIdleCallback
    delete (global as { cancelIdleCallback?: unknown }).cancelIdleCallback
  })
})
