import { promisify } from "util";
import { exec as execCb } from "child_process";
import { ARCHITECTURE_TYPE } from "../config/choices";
import { ConfigChoice } from "../config/config.types";
import { MessageUtil } from "../utils/message.util";
import type { Step } from "./step.types";


enum REPO_TEMPLATE_URL {
  CLEAN = "https://github.com/MGardier/create-nest-architect-template-clean.git",
  FEATURED = "https://github.com/MGardier/create-nest-architect-template-featured.git",
}

const cloneRepo = async (configChoice: ConfigChoice): Promise<void> => {
  const templateRepo: string =
    configChoice.architectureType === ARCHITECTURE_TYPE.CLEAN
      ? REPO_TEMPLATE_URL.CLEAN
      : REPO_TEMPLATE_URL.FEATURED;
  const projectName: string = configChoice.projectName;

  const exec = promisify(execCb);
  try {
    const { stdout, stderr } = await exec(
      `git clone --depth 1 --branch main ${templateRepo} ${projectName}`
    );
    MessageUtil.info(stdout);
    if (stderr) MessageUtil.info(stderr);
    MessageUtil.success("Successfully cloned the repository")
  } catch (err) {
    console.log(err)
    MessageUtil.error("An error occurred when trying to git clone template, please check that a project does not already exist and git works.");
    process.exit(1);
  }
};

export const loadTemplateStep: Step = {
  name: "load-template",
  run: cloneRepo,
};
