import { execa, ExecaError, parseCommandString } from "execa";
import { MessageUtil } from "../utils/message.util";


export interface CommandOptions {
  /** Directory the command runs in — defaults to the current one */
  cwd?: string;
}

// =============================================================================
//                              SERVICE METHODS
// =============================================================================

/**
 * The only place a child process is started.
 *
 * Commands are written as plain strings and split by execa — no shell
 * is spawned, so nothing in a command is expanded or interpolated.
 *
 */
export class CommandService {

  /**
   * Output is captured, never relayed: a successful command says
   * nothing, a failing one prints everything it had to say  
   */
  static async run(command: string, options: CommandOptions = {}): Promise<void> {
    const [file, ...args] = parseCommandString(command);

    try {
      await execa(file, args, { cwd: options.cwd });
    } catch (err) {
      if (err instanceof ExecaError) MessageUtil.error(err.stderr || err.stdout || err.shortMessage);
      throw err;
    }
  }

  /** Whether a binary answers at all — the requirements checks ask nothing more. */
  static async isAvailable(command: string): Promise<boolean> {
    const [file, ...args] = parseCommandString(command);

    try {
      await execa(file, args);
      return true;
    } catch {
      return false;
    }
  }
}
