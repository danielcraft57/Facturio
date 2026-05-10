declare module 'bcrypt';
declare module 'cookie-parser';
declare module 'nodemailer' {
  export type Transporter = any;
  export function createTransport(...args: any[]): Transporter;
}
declare module 'passport-jwt';
declare module 'passport-google-oauth20' {
  export type VerifyCallback = (...args: any[]) => void;
  export class Strategy {
    constructor(...args: any[]);
  }
}

