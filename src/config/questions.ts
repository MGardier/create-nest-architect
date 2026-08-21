import { MessageUtil } from "../utils/message.util";
import { PromptUtil } from "../services/prompt";
import { ormsForDatabase } from "../steps/orm/registry";
import {
  ARCHITECTURE_CHOICES,
  DATABASE_CHOICES,
  PACKAGER_CHOICES,
} from "./choices";
import { PartialConfig } from "./config.types";



// =============================================================================
//                              ASK METHODS
// =============================================================================

export const askProjectName = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUser(
    "Please specify a project name",
    "text",
    "answer"
  );
  return answer;
};

export const askPackager = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    "Which package manager would you like to use?",
    PACKAGER_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

export const askArchitecture = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    `Choose your project architecture:`,
    ARCHITECTURE_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

export const askDatabase = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    "Which database will your project use?",
    DATABASE_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

export const askOrm = async (config: PartialConfig): Promise<unknown> => {
  // The registry is the source of truth: only compatible installers are offered
  const compatible = ormsForDatabase(config.database!);

  if (compatible.length === 1) {
    MessageUtil.info(`→ ${compatible[0].label.trim()} (only option for this database)`);
    return compatible[0].id;
  }

  const { answer } = await PromptUtil.askUserWithChoices(
    "Which ORM/ODM would you like to set up?",
    compatible.map((installer) => ({ title: installer.label, value: installer.id })),
    "select",
    "answer"
  );
  return answer;
};

