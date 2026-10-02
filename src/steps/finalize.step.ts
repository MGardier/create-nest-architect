import type { FinalizeAction } from "./finalize/finalize-setup.types";
import { FinalizeSetup } from "./finalize/finalize.setup";
import type { Step } from "./step.types";




// =============================================================================
//                              ACTIONS LOOKUP
// =============================================================================

/**
 * Last tree step: what is adjusted once every choice has written its
 * own files. Adding a finishing touch = one line in FINALIZE_ACTIONS.
 */

const FINALIZE_ACTIONS: FinalizeAction[] = [
  { name: "lockfile", run: FinalizeSetup.removeUnusedLockfile },
  { name: "project-name", run: FinalizeSetup.renameProjectInPackageJson },
  { name: "env-example", run: FinalizeSetup.fillEnvExample },
];



// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================
/**
 * Runs the actions in order on the in-memory tree (an action is
 * skipped when its `when` returns false) and returns the concatenated
 * messages for the final recap.
 */
export const finalizeStep: Step = {
  name: "finalize",
  run: async (tree, config) => {
    const messages: string[] = [];

    for (const action of FINALIZE_ACTIONS) {
      if (action.when && !action.when(config)) continue;

      const message = await action.run(tree, config);
      if (message) messages.push(message);
    }

    return messages.join("\n");
  },
};
