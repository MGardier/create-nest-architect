#!/usr/bin/env node

import { ConfigChoice } from "./classes/configChoice.class";
import { PACKAGER_TYPE } from "./constants/packager.constants";
import { InitProject } from "./scripts/initProject";
import { runPipeline } from "./pipeline";
import { MessageUtil } from "./utils/message.util";
import { FsUtil } from "./utils/fs.util";


const main = async () => {

  const configChoice: ConfigChoice = await InitProject.collectProjectConfig();

  const ormOrOdmMessage: string = await runPipeline(configChoice);

  const { packager } = configChoice;
  const startCommand = packager.run('start dev ');


  let pnpmMessage = '';
  if (configChoice.packagerType === PACKAGER_TYPE.PNPM)
    pnpmMessage = `\n    ⚠️  Don't forget to approve builds with:\n    $ pnpm approve-builds\n`;


  MessageUtil.success(`\nProject ${FsUtil.extractProjectNameFromPath(configChoice.projectName)} was successfully installed and configured.`);
  MessageUtil.info(`\n
    ${ormOrOdmMessage}

    👉  Get started with the following commands:

    $ cd ${configChoice.projectName}${pnpmMessage}
    $ ${startCommand}


  `);
};


main().catch((err) => {
  MessageUtil.error(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
