#!/usr/bin/env node

import { PACKAGER_TYPE } from "./config/choices";
import { ConfigChoice, PartialConfig } from "./config/config.types";


import { MessageUtil } from "./utils/message.util";
import { FsUtil } from "./utils/fs.util";
import { executeConfig } from "./execute";
import { collectConfig } from "./collect";
import { validateRequirements } from "./requirements";


const main = async () => {

  // Nothing is asked and nothing is written until the environment is usable
  await validateRequirements();

  // Reading argv: pre-filled answers make the matching questions skipped
  const initial: PartialConfig = process.argv[2] ? { projectName: process.argv[2] } : {};

  const configChoice: ConfigChoice = await collectConfig(initial);

  const stepMessages: string[] = await executeConfig(configChoice);

  const { packager } = configChoice;
  const startCommand = packager.run('start dev ');


  let pnpmMessage = '';
  if (configChoice.packagerType === PACKAGER_TYPE.PNPM)
    pnpmMessage = `\n    ⚠️  Don't forget to approve builds with:\n    $ pnpm approve-builds\n`;


  MessageUtil.success(`\nProject ${FsUtil.extractProjectNameFromPath(configChoice.projectName)} was successfully installed and configured.`);
  MessageUtil.info(`\n
    ${stepMessages.join("\n")}

    👉  Get started with the following commands:

    $ cd ${configChoice.projectName}${pnpmMessage}
    $ ${startCommand}


  `);
};


main().catch((err) => {
  MessageUtil.error(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
