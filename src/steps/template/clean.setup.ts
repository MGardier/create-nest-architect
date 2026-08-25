import { promisify } from "util";
import { exec as execCb } from "child_process";
import { existsSync, promises as fs } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { ARCHITECTURE_TYPE } from "../../config/choices";
import { ConfigChoice } from "../../config/config.types";
import { VirtualTreeService } from "../../services/virtual-tree.service";
import { MessageUtil } from "../../utils/message.util";
import { TemplateMeta } from "./template-setup.types";

// =============================================================================
//                              META
// =============================================================================

export const CLEAN_META: TemplateMeta = {
  id: ARCHITECTURE_TYPE.CLEAN,
  repoUrl: "https://github.com/MGardier/create-nest-architect-template-clean.git",
};

// =============================================================================
//                              SETUP
// =============================================================================

/**
 * One method per unit of work, in the order of CLEAN_ACTIONS
 * (template.step.ts).
 */
export const CleanSetup = {

  cloneTemplate: async (tree: VirtualTreeService, config: ConfigChoice): Promise<void> => {
    if (existsSync(resolve(process.cwd(), config.projectName))) {
      MessageUtil.error("An error occurred when trying to git clone template, please check that a project does not already exist and git works.");
      process.exit(1);
    }

    const exec = promisify(execCb);
    const tmpRoot = await fs.mkdtemp(join(tmpdir(), "create-nest-architect-"));
    const cloneDir = join(tmpRoot, "template");

    try {
      const { stdout, stderr } = await exec(
        `git clone --depth 1 --branch main ${CLEAN_META.repoUrl} ${cloneDir}`
      );
      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);

      // The target directory is never touched here: the tree's commit is the only disk write
      await tree.fromTemplateDir(cloneDir);
      MessageUtil.success("Successfully cloned the repository");
    } catch (err) {
      console.log(err);
      MessageUtil.error("An error occurred when trying to git clone template, please check that a project does not already exist and git works.");
      process.exit(1);
    } finally {
      await fs.rm(tmpRoot, { recursive: true, force: true });
    }
  },
};
