import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

function parseDocumentTagLibrary(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];
	return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))];
}

function normalizeDocumentTags(tags: string[]): string[] {
	return [...new Set(tags.map((t) => t.trim()).filter(Boolean))].slice(0, 100);
}

/**
 * Service de gestion des utilisateurs
 * 
 * Gère :
 * - Le profil utilisateur (récupération, mise à jour)
 * - Le changement de mot de passe (avec vérification de l'ancien)
 * - L'association avec l'organisation
 * 
 * @see UsersController pour les endpoints API
 */
@Injectable()
export class UsersService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Récupère le profil d'un utilisateur
	 * 
	 * @param userId - ID de l'utilisateur
	 * @returns Utilisateur avec organisation
	 * @throws {NotFoundException} Si utilisateur non trouvé
	 */
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

	/**
	 * Met à jour le profil d'un utilisateur
	 * 
	 * @param userId - ID de l'utilisateur
	 * @param data - Données de mise à jour (tous les champs optionnels)
	 * @returns Utilisateur mis à jour avec organisation
	 */
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

	/**
	 * Change le mot de passe d'un utilisateur
	 * 
	 * Vérifie l'ancien mot de passe avant de le changer.
	 * Hash le nouveau mot de passe avec bcrypt (12 rounds).
	 * 
	 * @param userId - ID de l'utilisateur
	 * @param oldPassword - Ancien mot de passe
	 * @param newPassword - Nouveau mot de passe
	 * @returns Confirmation de changement
	 * @throws {BadRequestException} Si aucun mot de passe défini ou ancien mot de passe incorrect
	 */
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

	async getDocumentTagLibrary(userId: number): Promise<{ tags: string[] }> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { documentTagLibrary: true },
		});
		if (!user) throw new NotFoundException('Utilisateur introuvable');
		return { tags: parseDocumentTagLibrary(user.documentTagLibrary) };
	}

	async updateDocumentTagLibrary(userId: number, tags: string[]): Promise<{ tags: string[] }> {
		const normalized = normalizeDocumentTags(tags);
		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: { documentTagLibrary: normalized as unknown as Prisma.JsonArray },
			select: { documentTagLibrary: true },
		});
		return { tags: parseDocumentTagLibrary(updated.documentTagLibrary) };
	}

	async addDocumentTagToLibrary(userId: number, tag: string): Promise<{ tags: string[] }> {
		const current = (await this.getDocumentTagLibrary(userId)).tags;
		const t = tag.trim();
		if (!t) return { tags: current };
		if (current.includes(t)) return { tags: current };
		return this.updateDocumentTagLibrary(userId, [...current, t]);
	}
}

