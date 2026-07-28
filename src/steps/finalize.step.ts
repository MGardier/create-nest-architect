import { join, resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { ConfigChoice } from "../config/config.types";
import { FsUtil } from "../utils/fs.util";
import { MessageUtil } from "../utils/message.util";
import type { Step } from "./step.types";


// =============================================================================
//                   CLEAN PACKAGE LOCK JSON
// =============================================================================

const cleanPackageLockJson = async (targetDir: string, configChoice: ConfigChoice): Promise<void> => {
  const { packager } = configChoice;

  if (packager.lockfile !== 'package-lock.json') {
    const packageLockPath = join(targetDir, 'package-lock.json');
    try {
      await FsUtil.deleteDirectory(packageLockPath);
      MessageUtil.info('Removed npm package-lock.json from template');
    } catch (err) {
      MessageUtil.info('package-lock.json not found or already removed');
    }
  }
};



// =============================================================================
//                   INSTALL DEPENDENCIES 
// =============================================================================

const installDependencies = async (targetDir: string, configChoice: ConfigChoice): Promise<void> => {

  MessageUtil.info("\nInstalling dependencies...");
  const exec = promisify(execCb);
  const { packager } = configChoice;

  try {
    const { stdout, stderr } = await exec(
      packager.install, { cwd: targetDir }
    );

    MessageUtil.info(stdout);
    if (stderr) MessageUtil.info(stderr);
    MessageUtil.success("Dependencies successfully installed")
  } catch (err) {
    console.info(err)
    MessageUtil.error("An error occurred when trying to install dependencies, please do it manually.");
    process.exit(1);
  }

  const packageJsonPath = `${targetDir}/package.json`;
  let packageJsonContent = await FsUtil.getFileContent(packageJsonPath);
  packageJsonContent = FsUtil.updateProjectNameInPackageJson(packageJsonContent, configChoice.projectName)
  await FsUtil.createFile(packageJsonPath, packageJsonContent);
};


// =============================================================================
//                   REMOVE DOT GIT 
// =============================================================================

const removeDotGit = async (targetDir: string): Promise<void> => {
  await FsUtil.deleteDirectory(join(targetDir, '.git'));
};

export const finalizeStep: Step = {
  name: "finalize",
  run: async (configChoice) => {
    const targetDir = resolve(process.cwd(), configChoice.projectName);
    await cleanPackageLockJson(targetDir, configChoice);
    await installDependencies(targetDir, configChoice);
    await removeDotGit(targetDir);
  },
};
