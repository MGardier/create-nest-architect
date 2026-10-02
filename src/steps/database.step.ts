import { DATABASE } from "../config/choices";
import { MessageUtil } from "../utils/message.util";
import type { DatabaseAction } from "./database/database-setup.types";
import { PostgresqlSetup } from "./database/postgresql.setup";
import type { Step } from "./step.types";

/**
 * What each database brings to the project, as data — one entry per
 * unit of work, in the order it happens.
 *
 * Adding a database = one <database>.setup.ts + one action table + one
 * line in DATABASE_ACTIONS below.
 */

// =============================================================================
//                           POSTGRESQL ACTIONS
// =============================================================================

const POSTGRESQL_ACTIONS: DatabaseAction[] = [
  { name: "compose", run: PostgresqlSetup.writeCompose },
  { name: "next-steps", run: PostgresqlSetup.nextSteps },
];

// =============================================================================
//                              ACTIONS LOOKUP
// =============================================================================

/** A database with no entry simply gets no container. */
const DATABASE_ACTIONS: { id: DATABASE; actions: DatabaseAction[] }[] = [
  { id: DATABASE.POSTGRESQL, actions: POSTGRESQL_ACTIONS },
];


const findDatabaseActions = (id: DATABASE): DatabaseAction[] | undefined =>
  DATABASE_ACTIONS.find((entry) => entry.id === id)?.actions;

// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================

/** Runs the action table of the chosen database and returns its messages for the recap. */
export const setupDatabase: Step = {
  name: "database",

  when: (config) => !!findDatabaseActions(config.database),

  run: async (tree, config) => {
    MessageUtil.info(`\nSetting up ${config.database}...`);

    const messages: string[] = [];

    for (const action of findDatabaseActions(config.database)!) {
      if (action.when && !action.when(config)) continue;

      const message = await action.run(tree, config);
      if (message) messages.push(message);
    }

    return messages.join("\n");
  },
};
