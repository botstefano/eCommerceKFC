import { TokenPayload } from "../utils/jwt";

declare module 'express' {
  export interface Request {
    user?: TokenPayload;
  }
}

export {};
