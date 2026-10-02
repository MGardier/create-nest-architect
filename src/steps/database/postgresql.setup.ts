import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { MessageUtil } from "../../utils/message.util";
import { readTemplate } from "../orm/orm-setup.types";

// =============================================================================
//                              CONSTANTS
// =============================================================================

const COMPOSE_FILE = "compose.yaml";

// =============================================================================
//                              SETUP
// =============================================================================

/** One method per unit of work, in the order of POSTGRESQL_ACTIONS (database.step.ts). */
export const PostgresqlSetup = {

  writeCompose: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nGenerating ${COMPOSE_FILE}...`);

    // Plain read: a YAML template has no import to adapt to the module system
    tree.write(COMPOSE_FILE, await readTemplate(TEMPLATE_PATH.database.postgresql));
  },

  /** Writes nothing: closes the setup and returns its recap. */
  nextSteps: async (_tree: VirtualTreeService, _config: ConfigChoice): Promise<string> => `
    👉 Your database runs in Docker, credentials included :

      $ docker compose up -d

      Adminer comes with the "tools" profile : docker compose --profile tools up -d
    `,
};
