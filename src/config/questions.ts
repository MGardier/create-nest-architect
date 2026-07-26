import { ConfigChoice } from "../classes/configChoice.class";
import { MessageUtil } from "../utils/message.util";
import { PromptUtil } from "../services/prompt";
import {
  ARCHITECTURE_CHOICES,
  DB_LANGUAGE,
  DB_LANGUAGE_CHOICES,
  ODM_CHOICES,
  ORM_CHOICES,
  PACKAGER_CHOICES,
} from "./choices";
import { ConfigData, PartialConfig } from "./config.types";
import { validateConfig } from "./validate";

/**
 * The collect sequence as data: one entry per user decision, asked in
 * order. A question is skipped when its id is already filled in the
 * accumulated config or when its `when` condition returns false.
 */
interface Question {
  id: keyof ConfigData;
  when?: (config: PartialConfig) => boolean;
  ask: (config: PartialConfig) => Promise<unknown>;
}


// =============================================================================
//                              ASK METHODS
// =============================================================================

const askProjectName = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUser(
    "Please specify a project name",
    "text",
    "answer"
  );
  return answer;
};

const askPackager = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    "Which package manager would you like to use?",
    PACKAGER_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

const askArchitecture = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    `Choose your project architecture:`,
    ARCHITECTURE_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

const askDbLanguage = async (): Promise<unknown> => {
  const { answer } = await PromptUtil.askUserWithChoices(
    "Select the database type for your project:",
    DB_LANGUAGE_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

const askOrmOrOdm = async (config: PartialConfig): Promise<unknown> => {
  const isNoSql = config.dbLanguage === DB_LANGUAGE.NOSQL;
  const { answer } = await PromptUtil.askUserWithChoices(
    isNoSql ? "Which ODM would you like to set up?" : "Which ORM would you like to set up?",
    isNoSql ? ODM_CHOICES : ORM_CHOICES,
    "select",
    "answer"
  );
  return answer;
};

// =============================================================================
//                              QUESTIONS
// =============================================================================

const questions: Question[] = [
  { id: "projectName", ask: askProjectName },
  { id: "packagerType", ask: askPackager },
  { id: "architectureType", ask: askArchitecture },
  { id: "dbLanguage", ask: askDbLanguage },
  { id: "ormOrOdm", ask: askOrmOrOdm },
];


// =============================================================================
//                        ACCUMULATOR LOOP
// =============================================================================

export const collectConfig = async (
  initial: PartialConfig = {}
): Promise<ConfigChoice> => {
  const config: PartialConfig = { ...initial };

  for (const question of questions) {
    if (config[question.id] !== undefined) continue;
    if (question.when && !question.when(config)) continue;

    const answer = await question.ask(config);

    // prompts returns an object without the answer key on cancellation (Ctrl+C / Esc)
    if (answer === undefined) {
      MessageUtil.error("Aborted, nothing was created.");
      process.exit(1);
    }

    config[question.id] = answer as never;
  }

  return validateConfig(config);
};
