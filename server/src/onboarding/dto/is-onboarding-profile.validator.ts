import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator';
import { isValidOnboardingProfileId } from '../../catalog/onboarding-profiles';

@ValidatorConstraint({ name: 'isOnboardingProfile', async: false })
export class IsOnboardingProfileConstraint implements ValidatorConstraintInterface {
	validate(value: unknown): boolean {
		return typeof value === 'string' && isValidOnboardingProfileId(value);
	}

	defaultMessage(): string {
		return 'Profil onboarding invalide';
	}
}
