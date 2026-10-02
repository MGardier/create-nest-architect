import { ARCHITECTURE_TYPE } from "../config/choices";
import { ConfigChoice } from "../config/config.types";
import { MessageUtil } from "../utils/message.util";
import type { ExampleAction } from "./example/example-setup.types";
import { FeaturedPrismaSetup } from "./example/featured-prisma.setup";
import { PRISMA_META } from "./orm/prisma.setup";
import type { Step } from "./step.types";

/**
 * The runnable example, as data — one entry per architecture/orm pair.
 *
 * Adding an example = one <architecture>-<orm>.setup.ts + one action
 * table + one line in EXAMPLE_ACTIONS below.
 */

// =============================================================================
//                        FEATURED + PRISMA ACTIONS
// =============================================================================

const FEATURED_PRISMA_ACTIONS: ExampleAction[] = [
  { name: "files", run: FeaturedPrismaSetup.writeFiles },
  { name: "model", run: FeaturedPrismaSetup.addModelToSchema },
  { name: "app-module", run: FeaturedPrismaSetup.registerInAppModule },
  { name: "validation-pipe", run: FeaturedPrismaSetup.registerValidationPipe },
  { name: "next-steps", run: FeaturedPrismaSetup.nextSteps },
];

// =============================================================================
//                              ACTIONS LOOKUP
// =============================================================================

/** A pair with no entry simply gets no example. */
const EXAMPLE_ACTIONS: { architecture: ARCHITECTURE_TYPE; orm: string; actions: ExampleAction[] }[] = [
  { architecture: ARCHITECTURE_TYPE.FEATURED, orm: PRISMA_META.id, actions: FEATURED_PRISMA_ACTIONS },
];


const findExampleActions = (config: ConfigChoice): ExampleAction[] | undefined =>
  EXAMPLE_ACTIONS.find(
    (entry) => entry.architecture === config.architectureType && entry.orm === config.orm
  )?.actions;

// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================

/**
 * Runs the action table of the chosen architecture/orm pair and
 * returns its messages for the final recap.
 */
export const setupExample: Step = {
  name: "example",

  when: (config) => !!findExampleActions(config),

  run: async (tree, config) => {
    MessageUtil.info(`\nGenerating the ${config.architectureType} example...`);

    const messages: string[] = [];

    for (const action of findExampleActions(config)!) {
      if (action.when && !action.when(config)) continue;

      const message = await action.run(tree, config);
      if (message) messages.push(message);
    }

    return messages.join("\n");
  },
};
