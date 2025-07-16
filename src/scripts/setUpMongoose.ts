import { ConfigChoice } from "../classes/configChoice.class";
import { resolve } from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import { MessageUtil } from "../utils/message.util";

export abstract class SetUpMongoose {

    static async exec(configChoice: ConfigChoice) {
        const targetDir = resolve(process.cwd(), configChoice.projectName);
        if (configChoice.isArchitectureTypeClean()) {
            this.setUpMongooseClean(targetDir, configChoice);
        }
        else {
            this.setUpMongooseFeatured(targetDir, configChoice);
        }
    }

    static async setUpMongooseClean(targetDir: string, configChoice: ConfigChoice) {
    
        
    }

    static async setUpMongooseFeatured(targetDir: string, configChoice: ConfigChoice) {
        const exec = promisify(execCb);
        MessageUtil.info('Installing Mongoose...');
        await exec(`npm i @nestjs/mongoose mongoose`, {
            cwd: targetDir,
            shell: "/bin/bash"
        });
        MessageUtil.success('Mongoose successfully installed');

        //Ajouter une ligne au app.module.ts
        //un example d'entité pour le product  
        //un example de module pour product
        
    }
}