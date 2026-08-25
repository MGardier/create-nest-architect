export abstract class FsUtil {

  /********************** PRISMA ADD NEW MODULE  METHOD   *************************************************************************************************************/

  static addNewModuleClean(content: string, importFile: string, importModule: string): string {
    const result = content.replace(
      /(\/\/ Infrastructure \(Concrete implementation - adapters, ormModules, etc\.\))/,
      `$1\n${importFile};`
    );
    return result.replace(
      /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
      `$1\n    ${importModule},`
    );
  }

  static addNewModuleFeatured(content: string, importFile: string, importModule: string): string {
    const result = `${importFile} \n${content}`
    return result.replace(
      /(\/\/ Import necessary modules here \(ormModules, etc\.\))/,
      `$1\n    ${importModule},`
    );

  }

  /********************** PRISMA CONFIG METHOD   *************************************************************************************************************/

  static addOptionInPrismaConfig(content: string, option: string): string {
    return content.replace(
      /(\/\/ Define your prisma options modules here \(ormModules, etc\.\))/,
      `$1\n    ${option},`
    );

  }


  /********************** PACKAGE JSON  METHOD   *************************************************************************************************************/

  static extractProjectNameFromPath(projectName: string): string {
    if (projectName.includes('/') || projectName.includes('\\')) {
      const segments = projectName.split(/[/\\]/);
      return segments[segments.length - 1];
    }
    return projectName;
  }

  static updateProjectNameInPackageJson(content: string, projectName: string,): string {
    const cleanProjectName = FsUtil.extractProjectNameFromPath(projectName);

    return content.replace(
      /("name"\s*:\s*)"[^"]*"/g,
      `$1"${cleanProjectName}"`
    );

  }

}
