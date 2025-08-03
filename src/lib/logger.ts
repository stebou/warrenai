// src/lib/logger.ts
type Context = Record<string, unknown>;

function format(level: string, msg: string, ctx?: Context) {
  const base = {
    timestamp: new Date().toISOString(),
    level,
    message: msg,
    ...(ctx || {}),
  };
  return JSON.stringify(base);
}

export const log = {
  info: (msg: string, ctx?: Context) => {
    console.log(format('info', msg, ctx));
  },
  warn: (msg: string, ctx?: Context) => {
    console.warn(format('warn', msg, ctx));
  },
  error: (msg: string, ctx?: Context) => {
    console.error(format('error', msg, ctx));
  },
  debug: (msg: string, ctx?: Context) => {
    console.debug(format('debug', msg, ctx));
  },
};