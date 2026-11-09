export interface PollerOptions {
  /** One read of what is new. An error is swallowed: the next round tries again. */
  poll(): Promise<void>
  /** Whether the tab is on screen. A hidden tab makes no request at all. */
  isVisible(): boolean
  now(): number
  /** A number in [0, 1): the jitter of the delay, so that many open tabs do not ask in the same second. */
  random(): number
  intervalMs: number
  jitterMs: number
  /** After this long without an action of the person the polling stops (AC-22). */
  idleLimitMs: number
  onIdle(): void
  onResume(): void
}

/**
 * The rhythm of a conversation that is open (AC-22): a round every `intervalMs` ± `jitterMs` while the tab is visible, none while it is
 * hidden, one at once when it comes back, and a full stop after `idleLimitMs` without an action. Any action (`touch`) or the return of
 * the tab starts it again. It holds no React and no `window`, so the rules can be tested with fake timers.
 */
export class Poller {
  private timer: ReturnType<typeof setTimeout> | null = null
  private lastAction: number
  private running = false
  private idle = false
  private inFlight = false

  constructor(private readonly options: PollerOptions) {
    this.lastAction = options.now()
  }

  start() {
    this.running = true
    this.lastAction = this.options.now()
    this.schedule()
  }

  stop() {
    this.running = false
    this.clear()
  }

  /** Asks for what is new right now (the caller knows that something is missing); a stopped or idle polling stays as it is. */
  refresh() {
    if (this.running && !this.idle && this.options.isVisible()) void this.pollNow()
  }

  /** The person did something on the page: the idle clock starts over, and a stopped polling resumes with a round at once. */
  touch() {
    this.lastAction = this.options.now()
    if (this.running && this.idle) this.resume()
  }

  /** The tab was hidden or shown (or got the focus back). Hidden: no more rounds. Shown: a round at once, and the idle clock starts over. */
  visibilityChanged() {
    if (!this.running) return
    if (!this.options.isVisible()) return this.clear()
    this.lastAction = this.options.now()
    if (this.idle) {
      this.resume()
    } else {
      void this.pollNow()
    }
  }

  private resume() {
    this.idle = false
    this.options.onResume()
    void this.pollNow()
  }

  private delay() {
    return this.options.intervalMs + (this.options.random() * 2 - 1) * this.options.jitterMs
  }

  private schedule() {
    this.clear()
    if (!this.running || this.idle || !this.options.isVisible()) return
    this.timer = setTimeout(() => void this.tick(), this.delay())
  }

  private async tick() {
    this.timer = null
    if (!this.running || !this.options.isVisible()) return
    if (this.options.now() - this.lastAction >= this.options.idleLimitMs) {
      this.idle = true
      this.options.onIdle()
      return
    }
    await this.run()
    this.schedule()
  }

  private async pollNow() {
    this.clear()
    await this.run()
    this.schedule()
  }

  private async run() {
    if (this.inFlight) return
    this.inFlight = true
    try {
      await this.options.poll()
    } catch {
      // The next round asks again; a failed round is not a reason to stop.
    } finally {
      this.inFlight = false
    }
  }

  private clear() {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
