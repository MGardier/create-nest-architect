import { MessageUtil } from "../utils/message.util";

import { promisify } from "util";
import { exec as execCb } from "child_process";


export abstract class FinalizeProject {

    /********************** CLONE REPOSITORY  ******************************** */
  static async installDependencies(): Promise<void> {

    MessageUtil.info("Install dependecies ....");
    const exec = promisify(execCb);

    try {
      const { stdout, stderr } = await exec(
        `npm i `
      );
      MessageUtil.info(stdout);
      if (stderr) MessageUtil.info(stderr);
      MessageUtil.success("Depencies successfully  installed")
    } catch (err) {
      MessageUtil.error("An error append when try to install depencies, please make it manually.");
      process.exit(1);
    }
  }

  

}


