import { environment } from '../../../environments/environment';

export class Logger {
  static log(source: { name: string }, message: string) {
    this.logToConsole('log', source, message);
  }

  static warn(source: { name: string }, message: string) {
    this.logToConsole('warn', source, message);
  }

  static error(source: { name: string }, message: string) {
    this.logToConsole('error', source, message);
  }

  private static logToConsole(type: 'error' | 'warn' | 'log', source: { name: string }, message: string) {
    !environment.production ? console[type](this.format(source.name, message)) : undefined;
  }

  private static format(source: string, message: string): string {
    return `[${source}]: ${message}`;
  }
}
