import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('signup')
	async signup(@Body() data: SignupDto, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.signup(data);
		// Définir le cookie avec le token
		this.setAuthCookie(res, result.access_token);
		return result;
	}

	@Post('login')
	async login(@Body() data: LoginDto, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.login(data);
		// Définir le cookie avec le token
		this.setAuthCookie(res, result.access_token);
		return result;
	}

	@Post('logout')
	@UseGuards(JwtAuthGuard)
	async logout(@Res({ passthrough: true }) res: Response) {
		// Supprimer le cookie
		res.clearCookie('access_token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
		});
		return { message: 'Déconnexion réussie' };
	}

	private setAuthCookie(res: Response, token: string) {
		const isProduction = process.env.NODE_ENV === 'production';
		const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

		res.cookie('access_token', token, {
			httpOnly: true, // Empêche l'accès JavaScript côté client
			secure: isProduction, // HTTPS uniquement en production
			sameSite: 'lax', // Protection CSRF
			maxAge: maxAge,
			path: '/',
		});
	}

	@Get('google')
	@UseGuards(GoogleAuthGuard)
	googleAuth() {
		// Redirige vers Google
	}

	@Get('google/callback')
	@UseGuards(GoogleAuthGuard)
	async googleCallback(@Req() req: Request, @Res() res: Response) {
		const result = await this.authService.validateGoogleUser(req.user as any);
		// Définir le cookie avec le token
		this.setAuthCookie(res, result.access_token);
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
		res.redirect(`${frontendUrl}/auth/callback`);
	}

	@Post('google/link')
	@UseGuards(JwtAuthGuard)
	async linkGoogle(@CurrentUser() user: any, @Body() body: { googleToken: string }) {
		// En production, vérifier le token Google côté serveur
		// Pour l'instant, on accepte les données directement
		return this.authService.linkGoogleAccount(user.id, body as any);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	async getProfile(@CurrentUser() user: any) {
		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			organization: user.organization,
		};
	}
}

