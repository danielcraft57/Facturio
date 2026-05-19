import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class DeleteAccountDto {
	@IsEmail({}, { message: 'Email invalide' })
	@IsNotEmpty()
	@Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
	confirmEmail!: string;
}
