import { promisify } from "util";
import { exec as execCb } from "child_process";
import { existsSync, promises as fs } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { ARCHITECTURE_TYPE } from "../config/choices";
import { ConfigChoice } from "../config/config.types";
import { VirtualTreeService } from "../services/virtual-tree.service";
import { MessageUtil } from "../utils/message.util";
import type { Step } from "./step.types";


const REPO_TEMPLATE_URL: Record<ARCHITECTURE_TYPE, string> = {
  [ARCHITECTURE_TYPE.CLEAN]: "https://github.com/MGardier/create-nest-architect-template-clean.git",
  [ARCHITECTURE_TYPE.FEATURED]: "https://github.com/MGardier/create-nest-architect-template-featured.git",
};

/** Adding an architecture = one entry in REPO_TEMPLATE_URL. */
const getTemplateRepo = (architectureType: ARCHITECTURE_TYPE): string => 
  REPO_TEMPLATE_URL[architectureType];

/**
 * Clones the template into a temporary directory and loads it into the
 * tree (.git excluded). The target directory is never touched here:
 * the tree's commit is the only disk write.
 */
const cloneRepo = async (tree: VirtualTreeService, configChoice: ConfigChoice): Promise<void> => {
  const templateRepo: string = getTemplateRepo(configChoice.architectureType);

  if (existsSync(resolve(process.cwd(), configChoice.projectName))) {
    MessageUtil.error("An error occurred when trying to git clone template, please check that a project does not already exist and git works.");
    process.exit(1);
  }

  const exec = promisify(execCb);
  const tmpRoot = await fs.mkdtemp(join(tmpdir(), "create-nest-architect-"));
  const cloneDir = join(tmpRoot, "template");
  try {
    const { stdout, stderr } = await exec(
      `git clone --depth 1 --branch main ${templateRepo} ${cloneDir}`
    );
    MessageUtil.info(stdout);
    if (stderr) MessageUtil.info(stderr);
    await tree.fromTemplateDir(cloneDir);
    MessageUtil.success("Successfully cloned the repository")
  } catch (err) {
    console.log(err)
    MessageUtil.error("An error occurred when trying to git clone template, please check that a project does not already exist and git works.");
    process.exit(1);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
};

export const loadTemplateStep: Step = {
  name: "load-template",
  run: cloneRepo,
};
