import { Request, Response, NextFunction, RequestHandler } from "express";

// Define the type for the async handler function
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catch errors and pass them to next middleware (error handler)
  };
};
export default asyncHandler;