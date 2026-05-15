import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private prefix = '[Biblioteca]';

  private shouldLog(): boolean {
    return isDevMode();
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog()) console.info(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog()) console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]) {
    console.error(`${this.prefix} ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog()) console.debug(`${this.prefix} ${message}`, ...args);
  }
}
