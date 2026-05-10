import 'express';

// Extend Express Request with authenticated user.
declare module 'express-serve-static-core' {
	interface Request {
		user?: any;
	}
}

// Runtime deps without bundled typings in prod installs (or typings only in devDependencies).
declare module 'bcrypt';
declare module 'cookie-parser';
declare module 'nodemailer';
declare module 'passport-jwt';
declare module 'passport-google-oauth20';

