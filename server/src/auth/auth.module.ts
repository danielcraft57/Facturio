import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { BillingModule } from '../billing/billing.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

@Module({
	imports: [
		PrismaModule,
		CommonModule,
		BillingModule,
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
			signOptions: { expiresIn: '24h' },
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, AuthSessionService, JwtStrategy, GoogleStrategy, JwtAuthGuard, EmailVerifiedGuard],
	exports: [AuthService, AuthSessionService, JwtAuthGuard, EmailVerifiedGuard],
})
export class AuthModule {}

