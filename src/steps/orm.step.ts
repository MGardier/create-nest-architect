import { MessageUtil } from "../utils/message.util";
import { MongooseSetup, MONGOOSE_META } from "./orm/mongoose.setup";
import type { OrmAction } from "./orm/orm-setup.types";
import { PrismaSetup, PRISMA_META } from "./orm/prisma.setup";
import type { Step } from "./step.types";

/**
 * What each ORM writes, as data — one entry per file, in the order the
 * files are produced. The last entry writes nothing: it closes the
 * setup and returns the "next steps" recap.
 *
 * Adding an ORM = one <orm>.setup.ts + one action table + one line in
 * ORM_ACTIONS below.
 */

// =============================================================================
//                              PRISMA ACTIONS
// =============================================================================

const PRISMA_ACTIONS: OrmAction[] = [
  { name: "schema", run: PrismaSetup.writeSchema },
  { name: "module", run: PrismaSetup.writeModule },
  { name: "service", run: PrismaSetup.writeService },
  { name: "app-module", run: PrismaSetup.updateAppModule },
  { name: "prisma-config", run: PrismaSetup.writePrismaConfig },
  { name: "env-example", run: PrismaSetup.updateEnvExample },
  { name: "next-steps", run: PrismaSetup.nextSteps },
];

// =============================================================================
//                             MONGOOSE ACTIONS
// =============================================================================

const MONGOOSE_ACTIONS: OrmAction[] = [
  { name: "module", run: MongooseSetup.writeModule },
  { name: "entity", run: MongooseSetup.writeEntity },
  { name: "app-module", run: MongooseSetup.updateAppModule },
  { name: "env-example", run: MongooseSetup.updateEnvExample },
  { name: "next-steps", run: MongooseSetup.nextSteps },
];

// =============================================================================
//                              ACTIONS LOOKUP
// =============================================================================

const ORM_ACTIONS: { id: string; actions: OrmAction[] }[] = [
  { id: PRISMA_META.id, actions: PRISMA_ACTIONS },
  { id: MONGOOSE_META.id, actions: MONGOOSE_ACTIONS },
];


const findOrmActions = (id: string): OrmAction[] => {
  const entry = ORM_ACTIONS.find((entry) => entry.id === id);

  if (!entry) throw new Error(`No actions registered for ORM "${id}".`);

  return entry.actions;
};

// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================

/**
 * Runs the action table of the chosen ORM on the in-memory tree (an
 * action is skipped when its `when` returns false) and returns the
 * concatenated "next steps" messages for the final recap.
 */
export const setupOrm: Step = {
  name: "orm",
  run: async (tree, config) => {
    MessageUtil.info(`\nInstalling ${config.orm}...`);

    const messages: string[] = [];

    for (const action of findOrmActions(config.orm)) {
      if (action.when && !action.when(config)) continue;

      const message = await action.run(tree, config);
      if (message) messages.push(message);
    }

    return messages.join("\n");
  },
};
