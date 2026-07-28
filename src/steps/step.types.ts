import type { ConfigChoice } from "../config/config.types";


/**
 * The execution sequence as data, mirroring Question in questions.ts:
 * one entry per action, run in order by the pipeline. A step is skipped
 * when its `when` condition returns false. A step may return a string:
 * its "next steps" instructions, concatenated into the final recap.
 */
export interface Step {
  name: string;
  when?: (config: ConfigChoice) => boolean;
  run: (config: ConfigChoice) => Promise<string | void>;
}

