export class HttpError extends Error {
  statusCode: number;
  details: any;
  constructor(statusCode: number, message: string, details: any = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
