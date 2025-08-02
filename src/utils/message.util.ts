import chalk from 'chalk';


export abstract class MessageUtil {
  static error(message: string): void {
    console.error(chalk.red(`❌ ${message}`));
  }

  static success(message: string): void {
    console.log(chalk.green(`✔ ${message}`));
  }
  
    static info(message: string): void {
    console.log(chalk.yellow(`  ${message}`));
  }


}
