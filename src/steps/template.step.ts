import { ARCHITECTURE_TYPE } from "../config/choices";
import { MessageUtil } from "../utils/message.util";
import type { Step } from "./step.types";
import { CleanSetup, CLEAN_META } from "./template/clean.setup";
import { FeaturedSetup, FEATURED_META } from "./template/featured.setup";
import type { TemplateAction } from "./template/template-setup.types";

/**
 * What each architecture does to seed the tree, as data — one entry per
 * unit of work, in the order it happens.
 *
 * Adding an architecture = one <architecture>.setup.ts + one action
 * table + one line in TEMPLATE_ACTIONS below.
 */

// =============================================================================
//                              CLEAN ACTIONS
// =============================================================================

const CLEAN_ACTIONS: TemplateAction[] = [
  { name: "clone", run: CleanSetup.cloneTemplate },
];

// =============================================================================
//                             FEATURED ACTIONS
// =============================================================================

const FEATURED_ACTIONS: TemplateAction[] = [
  { name: "clone", run: FeaturedSetup.cloneTemplate },
];

// =============================================================================
//                              ACTIONS LOOKUP
// =============================================================================

const TEMPLATE_ACTIONS: { id: ARCHITECTURE_TYPE; actions: TemplateAction[] }[] = [
  { id: CLEAN_META.id, actions: CLEAN_ACTIONS },
  { id: FEATURED_META.id, actions: FEATURED_ACTIONS },
];


const findTemplateActions = (id: ARCHITECTURE_TYPE): TemplateAction[] => {
  const entry = TEMPLATE_ACTIONS.find((entry) => entry.id === id);

  if (!entry) throw new Error(`No actions registered for architecture "${id}".`);

  return entry.actions;
};

// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================

/**
 * Runs the action table of the chosen architecture on the in-memory
 * tree (an action is skipped when its `when` returns false) and returns
 * the concatenated messages for the final recap.
 */
export const setupTemplate: Step = {
  name: "template",
  run: async (tree, config) => {
    MessageUtil.info(`\nLoading ${config.architectureType} template...`);

    const messages: string[] = [];

    for (const action of findTemplateActions(config.architectureType)) {
      if (action.when && !action.when(config)) continue;

      const message = await action.run(tree, config);
      if (message) messages.push(message);
    }

    return messages.join("\n");
  },
};
