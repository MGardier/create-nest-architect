import chalk from "../../node_modules/chalk/source/index";

export abstract class MessageUtil {
  static error(message: string): void {
    console.error(chalk.red(`\n\n❌ ${message}`));
  }

  static success(message: string): void {
    console.log(chalk.green(`\n\n🟢 ${message}`));
  }
}
