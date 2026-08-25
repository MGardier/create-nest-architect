import { execa, parseCommandString } from "execa";
import { MessageUtil } from "../utils/message.util";


export interface CommandOptions {
  /** Directory the command runs in — defaults to the current one */
  cwd?: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
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

  static async run(command: string, options: CommandOptions = {}): Promise<CommandResult> {
    const [file, ...args] = parseCommandString(command);
    const { stdout, stderr } = await execa(file, args, { cwd: options.cwd });

    if (stdout) MessageUtil.info(stdout);
    if (stderr) MessageUtil.info(stderr);

    return { stdout, stderr };
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
