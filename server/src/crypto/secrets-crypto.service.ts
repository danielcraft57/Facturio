import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

/**
 * Chiffrement symétrique des secrets en BDD (clés Stripe prestataire, etc.).
 * Sans SECRETS_ENCRYPTION_KEY : stockage en clair (dev uniquement — log d’avertissement).
 */
@Injectable()
export class SecretsCryptoService {
	private readonly logger = new Logger(SecretsCryptoService.name);
	private readonly key: Buffer | null;

	constructor() {
		const raw = process.env.SECRETS_ENCRYPTION_KEY?.trim();
		if (!raw) {
			this.key = null;
			if (process.env.NODE_ENV === 'prod') {
				this.logger.warn(
					'SECRETS_ENCRYPTION_KEY absent : les secrets Stripe org sont stockés en clair (non recommandé en production).',
				);
			}
			return;
		}
		this.key =
			raw.length === 64 && /^[0-9a-f]+$/i.test(raw)
				? Buffer.from(raw, 'hex')
				: scryptSync(raw, 'facturio-secrets-salt', 32);
	}

	isEncryptionEnabled(): boolean {
		return this.key !== null;
	}

	encrypt(plaintext: string | null | undefined): string | null {
		if (plaintext == null || plaintext === '') return null;
		if (plaintext.startsWith(PREFIX)) return plaintext;
		if (!this.key) return plaintext;

		const iv = randomBytes(IV_LEN);
		const cipher = createCipheriv(ALGO, this.key, iv);
		const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
		const tag = cipher.getAuthTag();
		const blob = Buffer.concat([iv, tag, encrypted]);
		return PREFIX + blob.toString('base64');
	}

	decrypt(stored: string | null | undefined): string | null {
		if (stored == null || stored === '') return null;
		if (!stored.startsWith(PREFIX)) return stored;
		if (!this.key) {
			throw new Error(
				'Impossible de déchiffrer : SECRETS_ENCRYPTION_KEY requis (données chiffrées en base).',
			);
		}

		const blob = Buffer.from(stored.slice(PREFIX.length), 'base64');
		const iv = blob.subarray(0, IV_LEN);
		const tag = blob.subarray(IV_LEN, IV_LEN + TAG_LEN);
		const data = blob.subarray(IV_LEN + TAG_LEN);
		const decipher = createDecipheriv(ALGO, this.key, iv);
		decipher.setAuthTag(tag);
		return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
	}
}
