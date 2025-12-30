import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	async getProfile(userId: number) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: { organization: true },
		});

		if (!user) {
			throw new NotFoundException('Utilisateur introuvable');
		}

		return user;
	}

	async updateProfile(userId: number, data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
		return this.prisma.user.update({
			where: { id: userId },
			data: {
				firstName: data.firstName,
				lastName: data.lastName,
				phone: data.phone,
				avatar: data.avatar,
			},
			include: { organization: true },
		});
	}

	async changePassword(userId: number, oldPassword: string, newPassword: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user || !user.password) {
			throw new BadRequestException('Aucun mot de passe défini. Utilisez Google pour vous connecter.');
		}

		const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

		if (!isPasswordValid) {
			throw new BadRequestException('Ancien mot de passe incorrect');
		}

		const hashedPassword = await bcrypt.hash(newPassword, 12);

		await this.prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		});

		return { success: true };
	}
}

