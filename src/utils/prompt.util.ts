import prompts, { PromptType } from "prompts";
import { AskChoiceInterface } from "../interfaces/askChoice.interface";
import { ARCHITECTURE_TYPE } from "../constant/constant";
import { ChoiceUtil } from "./choice.util";

/************************ GENERIC METHODS ***********************************/

export class UtilPrompt {
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

    return answer;
  }

  /********************** PROJECT NAME  ******************************** */
  static async askProjectNameIfNeeded(): Promise<string> {
    let projectName = process.argv[2];
    if (!projectName) {
      const { answer } = await this.askUser(
        "🧙 Please specify a project name",
        "text",
        "answer"
      );
      projectName = answer;
    }
    return projectName;
  }

  /********************** ARCHITECTURE  ******************************** */
  static async askArchitecture(): Promise<string> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getArchitectureChoices();
    const { answer } = await this.askUserWithChoices(
      `🧙 Choose your project architecture:`,
      choices,
      "select",
      "answer"
    );
    console.log();
    return answer;
  }

  /********************** DB LANGUAGE  ******************************** */
  static async askDbLanguage(): Promise<string> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getDbLanguageChoices();
    const { answer } = await this.askUserWithChoices(
      "🧙 Select the database type for your project:",
      choices,
      "select",
      "answer"
    );
    return answer;
  }

  /********************** ORM  ******************************** */
  static async askOrm(): Promise<string> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getOrmChoices();
    const { answer } = await this.askUserWithChoices(
      "🧙 Which ORM would you like to set up?",
      choices,
      "select",
      "answer"
    );
    return answer;
  }

  /********************** ODM  ******************************** */
  static async askOdm(): Promise<string> {
    const choices: AskChoiceInterface[] = ChoiceUtil.getOdmChoices();
    const { answer } = await this.askUserWithChoices(
      "🧙 Which ODM would you like to set up?",
      choices,
      "select",
      "answer"
    );
    return answer;
  }
}
