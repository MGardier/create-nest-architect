import chalk from 'chalk';
import { SpinnerUtil } from './spinner.util';


export abstract class MessageUtil {
  static error(message: string): void {
    SpinnerUtil.clearActive();
    console.error(chalk.red(`❌ ${message}`));
  }

  static success(message: string): void {
    SpinnerUtil.clearActive();
    console.log(chalk.green(`✔ ${message}`));
  }
  
    static info(message: string): void {
    SpinnerUtil.clearActive();
    console.log(chalk.yellow(`  ${message}`));
  }


}
