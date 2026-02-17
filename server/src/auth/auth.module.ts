import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalOnlyGuard } from './guards/local-only.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
	imports: [
		PrismaModule,
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
			signOptions: { expiresIn: '24h' },
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, GoogleStrategy, LocalOnlyGuard, JwtAuthGuard],
	exports: [AuthService, LocalOnlyGuard, JwtAuthGuard],
})
export class AuthModule {}

