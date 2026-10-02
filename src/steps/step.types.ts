import type { ConfigChoice } from "../config/config.types";
import type { VirtualTreeService } from "../services/virtual-tree.service";


// =============================================================================
//                              ACTIONS
// =============================================================================

/**
 * What every unit of work shares, whichever step owns it. Each step
 * extends it to name its own actions and add what only it needs.
 */
export interface StepAction {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (tree: VirtualTreeService, config: ConfigChoice) => Promise<string | void>;
}

// =============================================================================
//                              STEPS
// =============================================================================

/**
 * The execution sequence as data, mirroring Question in questions.ts:
 * one entry per step, run in order by the pipeline. A step is skipped
 * when its `when` returns false, and may return its "next steps"
 * instructions for the final recap.
 *
 * Steps only write into the tree — the pipeline commits it to disk
 * once, after the last step.
 */
export interface Step extends StepAction {}

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
