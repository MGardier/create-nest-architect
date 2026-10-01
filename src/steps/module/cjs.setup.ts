import { MODULE_SYSTEM } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { ModuleInjectorService } from "../../services/module-injector/module-injector.service";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";
import { readTemplate } from "../orm/orm-setup.types";
import {
  JEST_CONFIG_FILES,
  JEST_DEV_DEPENDENCIES,
  JEST_TEST_SCRIPTS,
  JEST_TSCONFIG_TYPES,
  PACKAGE_JSON_PATH,
  TSCONFIG_PATH,
  VITEST_CONFIG_FILES,
  VITEST_DEV_DEPENDENCIES,
} from "./cjs.constants";
import { ModuleSystemMeta } from "./module-setup.types";

// =============================================================================
//                              META
// =============================================================================

export const CJS_META: ModuleSystemMeta = {
  id: MODULE_SYSTEM.CJS,
};

const PACKAGE_JSON = "package.json";
const TSCONFIG = "tsconfig.json";

/** Only a TypeScript source carries module syntax. */
const isTypeScriptSource = (path: string): boolean =>
  path.endsWith(".ts") && !path.endsWith(".d.ts");

// =============================================================================
//                              SETUP
// =============================================================================

/** One method per unit of work, in the order of CJS_ACTIONS (module.step.ts). */
export const CjsSetup = {

  removeModuleTypeFromPackageJson: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nRemoving the ESM module type from package.json...`);

    tree.write(PACKAGE_JSON, FsUtil.removeJsonValue(
      tree.read(PACKAGE_JSON),
      PACKAGE_JSON_PATH.moduleType
    ));
  },

  replaceTestScriptsWithJest: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nPointing the test scripts at Jest...`);

    tree.write(PACKAGE_JSON, FsUtil.mergeJsonValues(
      tree.read(PACKAGE_JSON),
      PACKAGE_JSON_PATH.scripts,
      JEST_TEST_SCRIPTS
    ));
  },

  replaceVitestDependenciesWithJest: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nSwapping the Vitest packages for the Jest ones...`);

    let manifest = tree.read(PACKAGE_JSON);

    for (const packageName of VITEST_DEV_DEPENDENCIES) {
      manifest = FsUtil.removeJsonValue(manifest, `${PACKAGE_JSON_PATH.devDependencies}.${packageName}`);
    }

    manifest = FsUtil.mergeJsonValues(manifest, PACKAGE_JSON_PATH.devDependencies, JEST_DEV_DEPENDENCIES);

    tree.write(PACKAGE_JSON, FsUtil.sortJsonKeys(manifest, PACKAGE_JSON_PATH.devDependencies));
  },

  replaceTsconfigTypesWithJest: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nDeclaring the Jest globals in tsconfig...`);

    tree.write(TSCONFIG, FsUtil.setJsonValue(
      tree.read(TSCONFIG),
      TSCONFIG_PATH.types,
      JEST_TSCONFIG_TYPES
    ));
  },

  deleteVitestConfigFiles: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nDeleting the Vitest configuration...`);

    for (const path of VITEST_CONFIG_FILES) tree.delete(path);
  },

  writeJestConfigFiles: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nWriting the Jest configuration...`);

    for (const file of JEST_CONFIG_FILES) {
      tree.write(file.target, await readTemplate(file.template));
    }
  },

  removeEsmSyntaxFromSources: async (tree: VirtualTreeService, _config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nRewriting the sources for CommonJS...`);

    for (const path of tree.paths().filter(isTypeScriptSource)) {
      const withoutJsExtensions = ModuleInjectorService.removeJsExtensionFromRelativeImports(tree.read(path));

      tree.write(path, ModuleInjectorService.removeAwaitFromTopLevelCalls(withoutJsExtensions));
    }
  },

  /** Writes nothing: closes the setup and returns its recap. */
  nextSteps: async (_tree: VirtualTreeService, _config: ConfigChoice): Promise<string> => {
    MessageUtil.success("Project correctly configured as a CommonJS project.");

    return `
    👉 Your project uses CommonJS:

      - Tests run with Jest, configured in jest.config.ts and test/jest-e2e.json.
      - Relative imports carry no .js extension.
    `;
  },
};
