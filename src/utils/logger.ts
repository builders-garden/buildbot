export class Logger {
  private componentId: string;

  constructor(componentId: string) {
    this.componentId = componentId;
  }

  public info(message: string) {
    console.info(
      `[${this.componentId}] - [${new Date().toISOString()}] ${message}`
    );
  }

  public error(message: string) {
    console.error(
      `[${this.componentId}] - [${new Date().toISOString()}] ${message}`
    );
  }

  public warn(message: string) {
    console.warn(
      `[${this.componentId}] - [${new Date().toISOString()}] ${message}`
    );
  }

  public debug(message: string) {
    console.debug(
      `[${this.componentId}] - [${new Date().toISOString()}] ${message}`
    );
  }

  public log(message: string) {
    console.log(
      `[${this.componentId}] - [${new Date().toISOString()}] ${message}`
    );
  }
}
