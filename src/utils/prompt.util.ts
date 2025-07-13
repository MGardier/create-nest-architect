import prompts, { PromptType } from "prompts";
import { AskChoiceInterface } from "../interfaces/askChoice.interface";
import {
  ARCHITECTURE_TYPE,
  DB_LANGUAGE,
  ODM_TYPE,
  ORM_TYPE,
} from "../constants/constant";
import { ChoiceUtil } from "./choice.util";

/************************ GENERIC METHODS ***********************************/

export abstract class PromptUtil {
  static async askUser(
    question: string,
    type: PromptType,
    field: string
  ): Promise<Record<string, string>> {
    const answer = await prompts({
      type,
      message: question,
      name: field,
    });
    console.log();
    return answer;
  }

  static async askUserWithChoices(
    question: string,
    choices: AskChoiceInterface[],
    type: PromptType,
    field: string
  ): Promise<Record<string, string>> {
    const answer = await prompts({
      type,
      message: question,
      name: field,
      choices,
    });
    console.log();
    return answer;
  }

  /********************** PROJECT NAME  ******************************** */
  static async askProjectNameIfNeeded(): Promise<string> {
    let projectName = process.argv[2];
    if (!projectName) {
      const { answer } = await this.askUser(
        "Please specify a project name",
        "text",
        "answer"
      );
      projectName = answer;
    }
    console.log();
    return projectName;
  }

  /********************** ARCHITECTURE  ******************************** */
  static async askArchitecture(): Promise<ARCHITECTURE_TYPE> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getArchitectureChoices();
    const { answer } = await this.askUserWithChoices(
      `Choose your project architecture:`,
      choices,
      "select",
      "answer"
    );
    console.log();
    return answer as ARCHITECTURE_TYPE;
  }

  /********************** DB LANGUAGE  ******************************** */
  static async askDbLanguage(): Promise<DB_LANGUAGE> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getDbLanguageChoices();
    const { answer } = await this.askUserWithChoices(
      "Select the database type for your project:",
      choices,
      "select",
      "answer"
    );
    console.log();
    return answer as DB_LANGUAGE;
  }

  /********************** ORM  ******************************** */
  static async askOrm(): Promise<ORM_TYPE> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getOrmChoices();
    const { answer } = await this.askUserWithChoices(
      "Which ORM would you like to set up?",
      choices,
      "select",
      "answer"
    );
    console.log();
    return answer as ORM_TYPE;
  }

  /********************** ODM  ******************************** */
  static async askOdm(): Promise<ODM_TYPE> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getOdmChoices();
    const { answer } = await this.askUserWithChoices(
      "Which ODM would you like to set up?",
      choices,
      "select",
      "answer"
    );
    console.log();
    return answer as ODM_TYPE;
  }
}
