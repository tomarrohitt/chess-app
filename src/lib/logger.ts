import chalk from "chalk";
import { NextFunction, Request, Response } from "express";

class RequestLogger {
  constructor(private readonly context: string) {}

  log(method: string, url: string, status: number, duration: number) {
    const timestamp = new Date()
      .toISOString()
      .replace("T", " ")
      .substring(0, 19);

    const timeTag = chalk.gray(timestamp);
    const contextTag = chalk.magenta(`[${this.context}]`);
    const sMethod = chalk.bold(method);
    const sUrl = chalk.white(url);

    let sStatus = String(status);
    if (status >= 500) sStatus = chalk.red(status);
    else if (status >= 400) sStatus = chalk.yellow(status);
    else if (status >= 300) sStatus = chalk.cyan(status);
    else if (status >= 200) sStatus = chalk.green(status);

    const sDuration = chalk.gray(`${duration}ms`);

    console.log(
      `${timeTag} ${contextTag} ${sMethod} ${sUrl} ${sStatus} ${sDuration}`,
    );
  }
}

const logger = new RequestLogger("Chess-Engine");

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.log(
      req.method,
      req.originalUrl || req.url,
      res.statusCode,
      duration,
    );
  });
  next();
};
