import { DATABASE_META, EnvVariable } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { FsUtil } from "../../utils/fs.util";
import { MessageUtil } from "../../utils/message.util";

// =============================================================================
//                              CONSTANTS
// =============================================================================

const ENV_EXAMPLE = ".env.example";

const NPM_LOCKFILE = "package-lock.json";

// =============================================================================
//                              ENV FORMATTING
// =============================================================================

/** Quoted only when the value holds a character a shell would read, as in a connection url. */
const formatEnvLine = (variable: EnvVariable): string =>
  /[:/?=\s]/.test(variable.value)
    ? `${variable.key}="${variable.value}"`
    : `${variable.key}=${variable.value}`;

/** Appends to what the template already declares, skipping the keys it holds. */
const appendEnvVariables = (current: string, variables: EnvVariable[]): string => {
  const missing = variables.filter((variable) => !current.includes(`${variable.key}=`));

  if (!missing.length) return current;

  return `${current.trimEnd()}\n\n${missing.map(formatEnvLine).join("\n")}\n`;
};

// =============================================================================
//                              SETUP
// =============================================================================

/** One method per unit of work, in the order of FINALIZE_ACTIONS (finalize.step.ts). */
export const FinalizeSetup = {

  removeUnusedLockfile: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    if (config.packager.lockfile === NPM_LOCKFILE) return;

    if (tree.delete(NPM_LOCKFILE)) MessageUtil.info(`Removed npm ${NPM_LOCKFILE} from template`);
  },

  renameProjectInPackageJson: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    tree.write("package.json", FsUtil.updateProjectNameInPackageJson(
      tree.read("package.json"),
      config.projectName
    ));
  },

  /** Collects the variables every choice declared on its meta. */
  fillEnvExample: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    MessageUtil.info(`\nFilling ${ENV_EXAMPLE}...`);

    const current = tree.exists(ENV_EXAMPLE) ? tree.read(ENV_EXAMPLE) : "";

    tree.write(ENV_EXAMPLE, appendEnvVariables(current, DATABASE_META[config.database].envVariables));
  },
};
