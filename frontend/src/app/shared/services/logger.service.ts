import { environment } from '../../../environments/environment';

export class Logger {
  static log(source: { name: string }, ...messages: unknown[]) {
    this.logToConsole('log', source, messages);
  }

  static warn(source: { name: string }, ...messages: unknown[]) {
    this.logToConsole('warn', source, messages);
  }

  static error(source: { name: string }, ...messages: unknown[]) {
    this.logToConsole('error', source, messages);
  }

  private static logToConsole(type: 'error' | 'warn' | 'log', source: { name: string }, messages: unknown[]) {
    // eslint-disable-next-line no-console
    !environment.production ? console[type](this.format(source.name), ...messages) : undefined;
  }

  private static format(source: string): string {
    return `[${source}]`;
  }
}
