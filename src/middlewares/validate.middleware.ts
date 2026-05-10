import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export function validate<T>(schema: ZodSchema<T>, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === "body") req.body = result.data;
    else if (source === "query") (req as any).query = result.data;
    else (req as any).params = result.data;
    next();
  };
}
