import { resolve } from "path";
import { findOrmMeta } from "../orm/registry";
import { formatDependency, type OrmDependency } from "../orm/orm-setup.types";
import { CommandService } from "../../services/command.service";
import type { IPackagerCommands } from "../../constants/packager.constants";
import { MessageUtil } from "../../utils/message.util";
import type { PostStep } from "../step.types";

/**
 * Splits the ORM dependencies by scope: one command per non-empty
 * group, production packages through `packager.add` and development
 * ones through `packager.addDev`. Each of them also installs the
 * template's own packages, so no extra `install` is needed — except
 * when the ORM brings nothing, where it becomes the only command.
 */
export const buildInstallCommands = (
  dependencies: OrmDependency[],
  packager: IPackagerCommands,
): string[] => {
  const packagesOf = (scope: OrmDependency["scope"]): string =>
    dependencies
      .filter((dependency) => dependency.scope === scope)
      .map(formatDependency)
      .join(" ");

  const production = packagesOf("dependencies");
  const development = packagesOf("devDependencies");

  const commands = [
    ...(production ? [packager.add(production)] : []),
    ...(development ? [packager.addDev(development)] : []),
  ];

  return commands.length ? commands : [packager.install];
};

/**
 * Post-commit: installs the template dependencies plus the ORM's own
 * packages, in one command per dependency scope.
 */
export const installStep: PostStep = {
  name: "install",
  run: async (configChoice) => {
    MessageUtil.info("\nInstalling dependencies...");

    const targetDir = resolve(process.cwd(), configChoice.projectName);
    const { packager } = configChoice;

    const commands = buildInstallCommands(findOrmMeta(configChoice.orm)!.dependencies, packager);

    try {
      for (const command of commands) {
        await CommandService.run(command, { cwd: targetDir });
      }
      MessageUtil.success("Dependencies successfully installed");
    } catch (err) {
      console.info(err);
      MessageUtil.error("An error occurred when trying to install dependencies, please do it manually.");
      process.exit(1);
    }
  },
};
