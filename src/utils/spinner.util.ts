import chalk from "chalk";


// =============================================================================
//                              CONSTANTS
// =============================================================================

const FRAMES = ["▹▹▹▹▹", "▸▹▹▹▹", "▹▸▹▹▹", "▹▹▸▹▹", "▹▹▹▸▹", "▹▹▹▹▸"];
const INTERVAL_MS = 120;

const HIDE_CURSOR = "\u001B[?25l";
const SHOW_CURSOR = "\u001B[?25h";
const CLEAR_LINE = "\r\u001B[K";



// =============================================================================
//                              CLASS
// =============================================================================

export class SpinnerUtil {

  /**
   * The spinner currently drawing, if any. MessageUtil erases it
   * before writing, so a message printed mid-spin — the output of a
   * failed command, typically — never lands on the animated line.
   */
  private static active: SpinnerUtil | null = null;

  private timer: NodeJS.Timeout | null = null;
  private frame = 0;

  constructor(private readonly text: string) {}

  /** Erases the animated line of the running spinner, if there is one. */
  static clearActive(): void {
    SpinnerUtil.active?.clearLine();
  }

  start(): void {
    if (this.timer || SpinnerUtil.active) return;

    SpinnerUtil.active = this;

    // No animation off a TTY: one line, then silence
    if (!process.stdout.isTTY) {
      console.log(`  ${this.text}`);
      return;
    }

    process.stdout.write(HIDE_CURSOR);
    this.draw();

    this.timer = setInterval(() => this.draw(), INTERVAL_MS);

    // A spinner must never be what keeps the process alive
    this.timer.unref();
  }

  /** Idempotent: leaves the line clean and the cursor visible. */
  stop(): void {
    if (SpinnerUtil.active !== this) return;

    SpinnerUtil.active = null;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (process.stdout.isTTY) process.stdout.write(CLEAR_LINE + SHOW_CURSOR);
  }

  private draw(): void {
    process.stdout.write(`${CLEAR_LINE}${chalk.cyan(FRAMES[this.frame])} ${this.text}`);
    this.frame = (this.frame + 1) % FRAMES.length;
  }

  private clearLine(): void {
    if (process.stdout.isTTY) process.stdout.write(CLEAR_LINE);
  }
}
