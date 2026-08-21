import { resolve } from "path";
import { ConfigChoice } from "./config/config.types";
import { VirtualTree } from "./services/tree.service";
import { finalizeStep } from "./steps/finalize.step";
import { loadTemplateStep } from "./steps/load-template.step";
import { ormStep } from "./steps/orm.step";
import { installStep } from "./steps/post/install.step";
import type { PostStep, Step } from "./steps/step.types";

/**
 * The execution sequence as data (mirror of questions[] in questions.ts).
 * Adding / reordering / conditioning a step = editing these arrays.
 *
 * - steps[]     : write into the in-memory tree — nothing on disk.
 * - postSteps[] : run on the real project directory, after the commit.
 */
const steps: Step[] = [
  loadTemplateStep,
  ormStep,
  finalizeStep,
];

const postSteps: PostStep[] = [
  installStep,
];

/** Test seam: lets unit tests run the loops with fake steps. */
export interface PipelineOverrides {
  steps?: Step[];
  postSteps?: PostStep[];
}

// =============================================================================
//                              PIPELINE LOOP
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
export const runPipeline = async (
  config: ConfigChoice,
  overrides: PipelineOverrides = {}
): Promise<string[]> => {

  const messages: string[] = [];
  const tree = new VirtualTree();

  for (const step of overrides.steps ?? steps) {
    if (step.when && !step.when(config)) continue;

    const message = await step.run(tree, config);
    if (message) messages.push(message);
  }

  // Any error above means nothing was ever written to disk
  await tree.commit(resolve(process.cwd(), config.projectName));

  for (const step of overrides.postSteps ?? postSteps) {
    if (step.when && !step.when(config)) continue;

    const message = await step.run(config);
    if (message) messages.push(message);
  }

  return messages;
};
