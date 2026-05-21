import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const MAX_SIGNATURE_LENGTH = 600_000;

function digitsOnly(value: unknown): string {
	return String(value ?? '').replace(/\D/g, '');
}

function passesLuhn(digits: string): boolean {
	if (!/^\d+$/.test(digits)) return false;
	let sum = 0;
	let alt = false;
	for (let i = digits.length - 1; i >= 0; i--) {
		let n = Number(digits[i]);
		if (alt) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		alt = !alt;
	}
	return sum % 10 === 0;
}

function trimMax(value: unknown, max: number): string | undefined {
	if (value == null) return undefined;
	const s = String(value).trim().slice(0, max);
	return s || undefined;
}

export function sanitizeOrganizationProfileUpdate(
	data: Record<string, unknown>,
): Prisma.OrganizationUpdateInput {
	const out = { ...data };

	if ('siret' in out) {
		const d = digitsOnly(out.siret);
		out.siret = d || null;
		if (d && (d.length !== 14 || !passesLuhn(d))) {
			throw new BadRequestException('SIRET invalide');
		}
	}
	if ('siren' in out) {
		const d = digitsOnly(out.siren);
		out.siren = d || null;
		if (d && (d.length !== 9 || !passesLuhn(d))) {
			throw new BadRequestException('SIREN invalide');
		}
	}
	const siret = digitsOnly(out.siret);
	const siren = digitsOnly(out.siren);
	if (siret.length === 14 && siren.length === 9 && siret.slice(0, 9) !== siren) {
		throw new BadRequestException('Le SIRET ne correspond pas au SIREN');
	}

	if ('signature' in out && out.signature != null) {
		const sig = String(out.signature);
		if (sig.length > MAX_SIGNATURE_LENGTH) {
			throw new BadRequestException('Signature trop volumineuse');
		}
	}

	if ('email' in out && out.email != null) {
		out.email = trimMax(String(out.email).toLowerCase(), 254);
	}
	if ('dataControllerEmail' in out && out.dataControllerEmail != null) {
		out.dataControllerEmail = trimMax(String(out.dataControllerEmail).toLowerCase(), 254);
	}
	if ('name' in out && out.name != null) {
		out.name = trimMax(out.name, 200);
	}
	if ('apeCode' in out && out.apeCode != null) {
		const ape = trimMax(String(out.apeCode).toUpperCase().replace(/\s/g, ''), 10);
		out.apeCode = ape && /^[0-9]{2}\.[0-9]{2}[A-Z]$/.test(ape) ? ape : null;
	}
	if ('apeLabel' in out && out.apeLabel != null) {
		out.apeLabel = trimMax(out.apeLabel, 200);
	}

	return out as Prisma.OrganizationUpdateInput;
}
