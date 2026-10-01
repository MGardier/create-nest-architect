import { MODULE_SYSTEM } from "../config/choices";
import { MessageUtil } from "../utils/message.util";
import { CjsSetup, CJS_META } from "./module/cjs.setup";
import type { ModuleSystemAction } from "./module/module-setup.types";
import type { Step } from "./step.types";

/** Adding a module system = one <system>.setup.ts + one action table + one line in MODULE_SYSTEM_ACTIONS. */

// =============================================================================
//                              CJS ACTIONS
// =============================================================================

const CJS_ACTIONS: ModuleSystemAction[] = [
  { name: "module-type", run: CjsSetup.removeModuleTypeFromPackageJson },
  { name: "test-scripts", run: CjsSetup.replaceTestScriptsWithJest },
  { name: "dev-dependencies", run: CjsSetup.replaceVitestDependenciesWithJest },
  { name: "tsconfig-types", run: CjsSetup.replaceTsconfigTypesWithJest },
  { name: "vitest-config", run: CjsSetup.deleteVitestConfigFiles },
  { name: "jest-config", run: CjsSetup.writeJestConfigFiles },
  { name: "sources", run: CjsSetup.removeEsmSyntaxFromSources },
  { name: "next-steps", run: CjsSetup.nextSteps },
];

// =============================================================================
//                              ACTIONS LOOKUP
// =============================================================================

/** ESM has no table: the templates are already ESM, so the step skips it — see `when`. */
const MODULE_SYSTEM_ACTIONS: { id: MODULE_SYSTEM; actions: ModuleSystemAction[] }[] = [
  { id: CJS_META.id, actions: CJS_ACTIONS },
];


const findModuleSystemActions = (id: MODULE_SYSTEM): ModuleSystemAction[] => {
  const entry = MODULE_SYSTEM_ACTIONS.find((entry) => entry.id === id);

  if (!entry) throw new Error(`No actions registered for module system "${id}".`);

  return entry.actions;
};

// =============================================================================
//                           ACCUMULATOR LOOP
// =============================================================================

/** Runs the action table of the chosen module system and returns its messages for the recap. */
export const setupModuleSystem: Step = {
  name: "module-system",

  /** The templates are written in ESM: only CommonJS has to be converted. */
  when: (config) => config.moduleSystem !== MODULE_SYSTEM.ESM,

  run: async (tree, config) => {
    MessageUtil.info(`\nConverting the project to ${config.moduleSystem}...`);

    const messages: string[] = [];

    for (const action of findModuleSystemActions(config.moduleSystem)) {
      if (action.when && !action.when(config)) continue;

      const message = await action.run(tree, config);
      if (message) messages.push(message);
    }

    return messages.join("\n");
  },
};
