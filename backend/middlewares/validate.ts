import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

const mapIssues = (issues) =>
  issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

export const validate = ({ body, params, query } = {}) => async (req, res, next) => {
  try {
    if (body) {
      req.body = await body.parseAsync(req.body);
    }

    if (params) {
      req.params = await params.parseAsync(req.params);
    }

    if (query) {
      req.query = await query.parseAsync(req.query);
    }

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new HttpError(400, "Validation failed", mapIssues(error.issues)));
      return;
    }

    next(error);
  }
};
