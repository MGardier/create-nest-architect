import { resolve } from "path";
import { findOrmMeta } from "../orm/registry";
import { CommandService } from "../../services/command.service";
import { MessageUtil } from "../../utils/message.util";
import type { PostStep } from "../step.types";

/**
 * Post-commit: installs the template dependencies plus the ORM's own
 * packages in one command (`packager.add` installs everything).
 */
export const installStep: PostStep = {
  name: "install",
  run: async (configChoice) => {
    MessageUtil.info("\nInstalling dependencies...");

    const targetDir = resolve(process.cwd(), configChoice.projectName);
    const { packager } = configChoice;

    const dependencies = findOrmMeta(configChoice.orm)!.dependencies;
    const command = dependencies.length
      ? packager.add(dependencies.join(" "))
      : packager.install;

    try {
      await CommandService.run(command, { cwd: targetDir });
      MessageUtil.success("Dependencies successfully installed");
    } catch (err) {
      console.info(err);
      MessageUtil.error("An error occurred when trying to install dependencies, please do it manually.");
      process.exit(1);
    }
  },
};
