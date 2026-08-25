import { spawn } from "child_process";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";

/********************** KEYSTROKES  ******************************** */

export const KEYS = {
  ENTER: "\n",
  DOWN: "\x1B[B",
};

/********************** INTERFACES  ******************************** */

export interface PromptAnswer {
  /** Question text to wait for on stdout before sending keys */
  waitFor: string;

  /** Keystrokes sent to stdin to answer the question */
  keys: string;
}

export interface CliRunResult {
  exitCode: number | null;

  /** Combined stdout + stderr, ANSI escape codes stripped */
  output: string;

  /** Path of the generated project inside workspaceDir */
  projectDir: string;
}

/********************** CLI RUNNER  ******************************** */

const CLI_BIN = resolve(__dirname, "../../../dist/cli.js");
const ANSI_PATTERN = /\x1B\[[0-9;]*[A-Za-z]/g;

/** Creates the temporary directory the CLI will be executed in. */
export async function createWorkspace(): Promise<string> {
  return mkdtemp(join(tmpdir(), "create-nest-architect-e2e-"));
}

/**
 * Runs the compiled CLI as a black box inside workspaceDir, answering
 * interactive prompts by writing keystrokes to stdin once the matching
 * question is detected on stdout.
 *
 * The caller owns workspaceDir and is responsible for deleting it,
 * including when this function rejects (timeout or spawn error).
 */
export async function runCli(
  workspaceDir: string,
  projectName: string,
  answers: PromptAnswer[],
  timeoutMs: number
): Promise<CliRunResult> {
  return new Promise<CliRunResult>((resolvePromise, rejectPromise) => {
    // detached => own process group, so a timeout can kill the CLI along
    // with any package-manager child still writing into workspaceDir
    const child = spawn("node", [CLI_BIN, projectName], {
      cwd: workspaceDir,
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });

    let output = "";
    const pending = [...answers];

    const timer = setTimeout(() => {
      if (child.pid) process.kill(-child.pid, "SIGKILL");
      else child.kill("SIGKILL");
      rejectPromise(
        new Error(`CLI timed out after ${timeoutMs}ms.\nOutput so far:\n${output}`)
      );
    }, timeoutMs);

    const answerIfPromptVisible = () => {
      while (pending.length && output.includes(pending[0].waitFor)) {
        const answer = pending.shift()!;
        child.stdin.write(answer.keys);
        if (!pending.length) child.stdin.end();
      }
    };

    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString().replace(ANSI_PATTERN, "");
      answerIfPromptVisible();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString().replace(ANSI_PATTERN, "");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      rejectPromise(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolvePromise({
        exitCode: code,
        output,
        projectDir: join(workspaceDir, projectName),
      });
    });
  });
}
