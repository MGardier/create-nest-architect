import { ConfigChoice,  PartialConfig, Question } from "./config/config.types";
import { askArchitecture, askDatabase, askOrm, askPackager, askProjectName } from "./config/questions";
import { validateConfig } from "./config/validate";
import { MessageUtil } from "./utils/message.util";



// =============================================================================
//                              QUESTIONS
// =============================================================================

const questions: Readonly<Question[]> = [
  { id: "projectName", ask: askProjectName },
  { id: "packagerType", ask: askPackager },
  { id: "architectureType", ask: askArchitecture },
  { id: "database", ask: askDatabase },
  { id: "orm", ask: askOrm },
];


// =============================================================================
//                        ACCUMULATOR LOOP
// =============================================================================

export const collectConfig = async (
  initialConfig: PartialConfig = {}
): Promise<ConfigChoice> => {
  const config: PartialConfig = { ...initialConfig };

  for (const question of questions) {

    //Skip question part
    if (config[question.id] !== undefined) continue;
    if (question.when && !question.when(config)) continue;

    //Question call 
    const answer = await question.ask(config);

    // Answer undefined ===  cancellation by user (Ctrl+C / Esc) 
    if (answer === undefined) {
      MessageUtil.error("Aborted, nothing was created.");
      process.exit(1);
    }

    config[question.id] = answer as never;
  }

  return validateConfig(config);
};