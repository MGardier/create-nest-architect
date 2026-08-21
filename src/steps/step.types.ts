import type { ConfigChoice } from "../config/config.types";
import type { VirtualTree } from "../services/tree.service";


/**
 * The execution sequence as data, mirroring Question in questions.ts:
 * one entry per action, run in order by the pipeline. A step is skipped
 * when its `when` condition returns false. A step may return a string:
 * its "next steps" instructions, concatenated into the final recap.
 *
 * Steps only write into the tree — the pipeline commits it to disk
 * once, after the last step.
 */
export interface Step {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (tree: VirtualTree, config: ConfigChoice) => Promise<string | void>;
}

/**
 * Post-commit phase: actions that need the real project directory
 * (network, child processes — e.g. installing dependencies). Run by
 * the pipeline after tree.commit().
 */
export interface PostStep {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (config: ConfigChoice) => Promise<string | void>;
}
