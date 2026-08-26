export abstract class FsUtil {

  /********************** PACKAGE JSON  METHOD   *************************************************************************************************************/

  static extractProjectNameFromPath(projectName: string): string {
    if (projectName.includes('/') || projectName.includes('\\')) {
      const segments = projectName.split(/[/\\]/);
      return segments[segments.length - 1];
    }
    return projectName;
  }

  static updateProjectNameInPackageJson(content: string, projectName: string,): string {
    const packageJson = JSON.parse(content);
    packageJson.name = FsUtil.extractProjectNameFromPath(projectName);

    return `${JSON.stringify(packageJson, null, 2)}\n`;
  }

}
