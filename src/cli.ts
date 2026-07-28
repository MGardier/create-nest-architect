#!/usr/bin/env node

import { PACKAGER_TYPE } from "./config/choices";
import { ConfigChoice, PartialConfig } from "./config/config.types";
import { collectConfig } from "./config/questions";
import { runPipeline } from "./pipeline";
import { MessageUtil } from "./utils/message.util";
import { FsUtil } from "./utils/fs.util";


const main = async () => {

  // Reading argv is the CLI's job: pre-filled answers make the matching questions skipped
  const initial: PartialConfig = process.argv[2] ? { projectName: process.argv[2] } : {};

  const configChoice: ConfigChoice = await collectConfig(initial);

  const stepMessages: string[] = await runPipeline(configChoice);

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
