import { ConfigChoice } from "../../config/config.types";
import { TEMPLATE_PATH } from "../../constants/constant";
import { ModuleInjectorService } from "../../services/module-injector/module-injector.service";
import { GlobalPipe } from "../../services/module-injector/module-injector.types";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { MessageUtil } from "../../utils/message.util";
import { importPathFor, readTemplateFor } from "../module/module-system.util";
import { readTemplate } from "../orm/orm-setup.types";

// =============================================================================
//                              PATHS
// =============================================================================

/** Featured gathers the example in one feature folder. */
const EXAMPLE_DIR = "src/user";

/** Featured only, so the schema always sits at the project root. */
const SCHEMA_FILE = "prisma/schema.prisma";

const EXAMPLE_FILES: { template: string; target: string }[] = [
  { template: TEMPLATE_PATH.prisma.example.featured.dto, target: `${EXAMPLE_DIR}/dto/create-user.dto.ts` },
  { template: TEMPLATE_PATH.prisma.example.featured.service, target: `${EXAMPLE_DIR}/user.service.ts` },
  { template: TEMPLATE_PATH.prisma.example.featured.controller, target: `${EXAMPLE_DIR}/user.controller.ts` },
  { template: TEMPLATE_PATH.prisma.example.featured.module, target: `${EXAMPLE_DIR}/user.module.ts` },
];

// =============================================================================
//                              APP WIRING
// =============================================================================

/** The example's module, as src/app.module.ts sees it. */
const USER_MODULE_PATH = "./user/user.module";

/** What makes the DTO decorators actually reject a malformed payload. */
const VALIDATION_PIPE: GlobalPipe = {
  importPath: "@nestjs/common",
  namedImports: ["ValidationPipe"],
  expression: "new ValidationPipe({ whitelist: true, transform: true })",
};

// =============================================================================
//                              SETUP
// =============================================================================

/** One method per unit of work, in the order of FEATURED_PRISMA_ACTIONS (example.step.ts). */
export const FeaturedPrismaSetup = {

  writeFiles: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nGenerating the user example in ${EXAMPLE_DIR}...`);

    for (const file of EXAMPLE_FILES) {
      tree.write(file.target, await readTemplateFor(config, file.template));
    }
  },

  /** The endpoint needs its table: the model goes with the example, not with the schema. */
  addModelToSchema: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    tree.write(SCHEMA_FILE, tree.read(SCHEMA_FILE) + await readTemplate(TEMPLATE_PATH.prisma.example.model));
  },

  registerInAppModule: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    tree.write("src/app.module.ts", ModuleInjectorService.addModuleImport(
      tree.read("src/app.module.ts"),
      {
        importPath: importPathFor(config, USER_MODULE_PATH),
        namedImports: ["UserModule"],
        entry: "UserModule",
      }
    ));
  },

  registerValidationPipe: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    tree.write("src/main.ts", ModuleInjectorService.addGlobalPipe(
      tree.read("src/main.ts"),
      VALIDATION_PIPE
    ));
  },

  /** Writes nothing: closes the setup and returns its recap. */
  nextSteps: async (_tree: VirtualTreeService, _config: ConfigChoice): Promise<string> => `
    👉 A POST /users endpoint lives in ${EXAMPLE_DIR} :

      Hitting it walks the whole project — validation, service, Prisma, database.
    `,
};
