import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import type { Step } from "./step.types";

/**
 * Last tree step: adjusts what the template left behind — the npm
 * lockfile when another packager was chosen, and the project name in
 * package.json. Dependency installation happens post-commit
 * (steps/post/install.step.ts).
 */
export const finalizeStep: Step = {
  name: "finalize",
  run: async (tree, configChoice) => {
    const { packager } = configChoice;

    if (packager.lockfile !== "package-lock.json" && tree.delete("package-lock.json")) {
      MessageUtil.info("Removed npm package-lock.json from template");
    }

    const packageJsonContent = tree.read("package.json");
    tree.write(
      "package.json",
      FsUtil.updateProjectNameInPackageJson(packageJsonContent, configChoice.projectName)
    );
  },
};
