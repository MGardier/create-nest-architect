import { resolve } from "path";
import { ConfigChoice } from "./config/config.types";
import { VirtualTreeService } from "./services/virtual-tree.service";
import { finalizeStep } from "./steps/finalize.step";
import { setupTemplate } from "./steps/template.step";
import { setupOrm } from "./steps/orm.step";
import { installStep } from "./steps/post/install.step";
import type { PostStep, Step } from "./steps/step.types";

/**
 * - steps[]     : run on virtual tree — nothing on disk.
 * - postSteps[] : run on the real project directory, after the commit.
 */
const STEPS: Step[] = [
  setupTemplate,
  setupOrm,
  finalizeStep,
];

const POST_STEPS: PostStep[] = [
  installStep,
];

export interface ExecutionPipeline {
  steps?: Step[];
  postSteps?: PostStep[];
}

// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================

/**
 * The pipeline, in three phases:
 *
 * 1. Runs each step of steps[] on the in-memory tree
 *    (a step is skipped when its `when` returns false).
 * 
 * 2. tree.commit() — the single disk write.
 *    Any error before this line = nothing on disk.
 * 
 * 3. Runs postSteps[] on the real project directory.
 *
 * Returns the "next steps" messages of the steps, for the final recap.
 * No prompt, no console.log here.
 */
export const executeConfig = async (
  config: ConfigChoice,
  overrides: ExecutionPipeline = {}
): Promise<string[]> => {

  const messages: string[] = [];
  const tree = new VirtualTreeService();


  // STEPPER ACCUMULATOR
  for (const step of overrides.steps ?? STEPS) {
    if (step.when && !step.when(config)) continue;

    const message = await step.run(tree, config);
    if (message) messages.push(message);
  }

  // Any error above means nothing was ever written to disk
  await tree.commit(resolve(process.cwd(), config.projectName));

  // POST STEPPER ACCUMULATOR
  for (const step of overrides.postSteps ?? POST_STEPS) {
    if (step.when && !step.when(config)) continue;

    const message = await step.run(config);
    if (message) messages.push(message);
  }

  return messages;
};


