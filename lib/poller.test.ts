import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Poller } from "./poller"

const MINUTE = 60_000

function setup(options: { visible?: boolean; random?: () => number } = {}) {
  const state = { visible: options.visible ?? true }
  const poll = vi.fn(async () => {})
  const onIdle = vi.fn()
  const onResume = vi.fn()
  const poller = new Poller({
    poll,
    isVisible: () => state.visible,
    now: () => Date.now(),
    random: options.random ?? (() => 0.5),
    intervalMs: 5000,
    jitterMs: 1000,
    idleLimitMs: 15 * MINUTE,
    onIdle,
    onResume,
  })
  return { state, poll, onIdle, onResume, poller }
}

describe("Poller", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("asks every five seconds while the tab is visible", async () => {
    const { poll, poller } = setup()
    poller.start()

    await vi.advanceTimersByTimeAsync(4999)
    expect(poll).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(poll).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(poll).toHaveBeenCalledTimes(3)
  })

  it("asks at once when told that something is missing, and then goes on at its own pace", async () => {
    const { poll, poller } = setup()
    poller.start()
    await vi.advanceTimersByTimeAsync(2000)

    poller.refresh()
    await vi.advanceTimersByTimeAsync(0)
    expect(poll).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(4999)
    expect(poll).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(poll).toHaveBeenCalledTimes(2)
  })

  it("does not ask when it is stopped, hidden or idle", async () => {
    const stopped = setup()
    stopped.poller.refresh()
    expect(stopped.poll).not.toHaveBeenCalled()

    const hidden = setup({ visible: false })
    hidden.poller.start()
    hidden.poller.refresh()
    expect(hidden.poll).not.toHaveBeenCalled()
  })

  it("keeps each delay within five seconds plus or minus one", async () => {
    const early = setup({ random: () => 0 })
    early.poller.start()
    await vi.advanceTimersByTimeAsync(4000)
    expect(early.poll).toHaveBeenCalledTimes(1)

    const late = setup({ random: () => 0.9 })
    late.poller.start()
    await vi.advanceTimersByTimeAsync(5799)
    expect(late.poll).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(late.poll).toHaveBeenCalledTimes(1)
  })

  it("makes no request while the tab is hidden", async () => {
    const { poll, poller } = setup({ visible: false })
    poller.start()

    await vi.advanceTimersByTimeAsync(5 * MINUTE)

    expect(poll).not.toHaveBeenCalled()
  })

  it("stops when the tab is hidden and asks at once when it is shown again", async () => {
    const { state, poll, poller } = setup()
    poller.start()
    await vi.advanceTimersByTimeAsync(5000)
    expect(poll).toHaveBeenCalledTimes(1)

    state.visible = false
    poller.visibilityChanged()
    await vi.advanceTimersByTimeAsync(MINUTE)
    expect(poll).toHaveBeenCalledTimes(1)

    state.visible = true
    poller.visibilityChanged()
    await vi.advanceTimersByTimeAsync(0)
    expect(poll).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(5000)
    expect(poll).toHaveBeenCalledTimes(3)
  })

  it("stops after fifteen minutes without an action", async () => {
    const { poll, onIdle, poller } = setup()
    poller.start()

    await vi.advanceTimersByTimeAsync(15 * MINUTE + 10_000)
    const calls = poll.mock.calls.length
    await vi.advanceTimersByTimeAsync(5 * MINUTE)

    expect(onIdle).toHaveBeenCalledTimes(1)
    expect(poll).toHaveBeenCalledTimes(calls)
  })

  it("does not stop while the person keeps acting", async () => {
    const { poll, onIdle, poller } = setup()
    poller.start()

    for (let minute = 0; minute < 30; minute += 1) {
      await vi.advanceTimersByTimeAsync(MINUTE)
      poller.touch()
    }

    expect(onIdle).not.toHaveBeenCalled()
    expect(poll.mock.calls.length).toBeGreaterThan(300)
  })

  it("resumes with a round at once when the person acts after it stopped", async () => {
    const { poll, onIdle, onResume, poller } = setup()
    poller.start()
    await vi.advanceTimersByTimeAsync(16 * MINUTE)
    expect(onIdle).toHaveBeenCalledTimes(1)
    const calls = poll.mock.calls.length

    poller.touch()
    await vi.advanceTimersByTimeAsync(0)

    expect(onResume).toHaveBeenCalledTimes(1)
    expect(poll).toHaveBeenCalledTimes(calls + 1)
    await vi.advanceTimersByTimeAsync(5000)
    expect(poll).toHaveBeenCalledTimes(calls + 2)
  })

  it("does not ask extra when the person only acts while the polling runs", async () => {
    const { poll, poller } = setup()
    poller.start()

    poller.touch()
    poller.touch()
    await vi.advanceTimersByTimeAsync(0)

    expect(poll).not.toHaveBeenCalled()
  })

  it("goes on after a round that failed", async () => {
    const { poll, poller } = setup()
    poll.mockRejectedValueOnce(new Error("offline"))
    poller.start()

    await vi.advanceTimersByTimeAsync(10_000)

    expect(poll).toHaveBeenCalledTimes(2)
  })

  it("does not start a round while another one is still running", async () => {
    const { poll, poller } = setup()
    let finish: () => void = () => {}
    poll.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)))
    poller.start()
    await vi.advanceTimersByTimeAsync(5000)

    poller.visibilityChanged()
    await vi.advanceTimersByTimeAsync(0)
    expect(poll).toHaveBeenCalledTimes(1)

    finish()
    await vi.advanceTimersByTimeAsync(5000)
    expect(poll).toHaveBeenCalledTimes(2)
  })

  it("makes no more rounds after stop", async () => {
    const { poll, poller } = setup()
    poller.start()
    poller.stop()

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(poll).not.toHaveBeenCalled()
  })
})
