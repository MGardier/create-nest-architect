import { ConfigChoice } from "./config/config.types";
import { finalizeStep } from "./steps/finalize.step";
import { loadTemplateStep } from "./steps/load-template.step";
import { ormStep } from "./steps/orm.step";
import type { Step } from "./steps/step.types";

/**
 * The execution sequence as data, mirroring questions[] in questions.ts:
 * adding / reordering / conditioning a step = editing this array.
 */
const pipeline: Step[] = [
  loadTemplateStep,
  ormStep,
  finalizeStep,
];

/**
 * Runs each step of pipeline[] in order, skipping those whose `when`
 * condition returns false, and collects the "next steps" messages the
 * steps return for the final recap. No prompt, no console.log here.
 */
export const runPipeline = async (config: ConfigChoice): Promise<string[]> => {

  const messages: string[] = [];

  for (const step of pipeline) {
    if (step.when && !step.when(config)) continue;

    const message = await step.run(config);
    if (message) messages.push(message);
  }

  return messages;
};
