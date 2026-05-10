declare global {
  namespace Express {
    interface User {
      [key: string]: unknown;
    }

    interface Request {
      user?: User;
    }
  }
}

// Runtime deps without bundled typings in prod installs (or typings only in devDependencies).
declare module 'bcrypt';
declare module 'cookie-parser';
declare module 'nodemailer';
declare module 'passport-jwt';
declare module 'passport-google-oauth20';

export {};

