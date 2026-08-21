import { promisify } from "util";
import { exec as execCb } from "child_process";
import { resolve } from "path";
import { findOrmInstaller } from "../orm/registry";
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

    const exec = promisify(execCb);
    const targetDir = resolve(process.cwd(), configChoice.projectName);
    const { packager } = configChoice;

    // validate already guaranteed the installer exists
    const dependencies = findOrmInstaller(configChoice.orm)!.dependencies;
    const command = dependencies.length
      ? packager.add(dependencies.join(" "))
      : packager.install;

    try {
      const { stdout, stderr } = await exec(command, { cwd: targetDir });
      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);
      MessageUtil.success("Dependencies successfully installed");
    } catch (err) {
      console.info(err);
      MessageUtil.error("An error occurred when trying to install dependencies, please do it manually.");
      process.exit(1);
    }
  },
};
