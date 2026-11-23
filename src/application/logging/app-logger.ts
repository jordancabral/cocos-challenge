export const APP_LOGGER = Symbol('APP_LOGGER');

export interface AppLogger {
  info(
    message: string,
    fields?: Record<string, string | number | boolean | null>,
  ): void;
}

export const noopLogger: AppLogger = {
  info() {
    return undefined;
  },
};
