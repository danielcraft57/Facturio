import { Injectable } from '@nestjs/common';

export type MobileDeviceRegistration = {
	organizationId: number;
	userId: number;
	platform: 'android' | 'ios' | 'web';
	expoPushToken: string;
	deviceName?: string;
	appVersion?: string;
	updatedAt: string;
};

@Injectable()
export class MobileNotificationsService {
	private readonly devices = new Map<string, MobileDeviceRegistration>();

	registerDevice(input: Omit<MobileDeviceRegistration, 'updatedAt'>): MobileDeviceRegistration {
		const key = `${input.organizationId}:${input.userId}:${input.expoPushToken}`;
		const registration: MobileDeviceRegistration = {
			...input,
			updatedAt: new Date().toISOString(),
		};
		this.devices.set(key, registration);
		return registration;
	}

	listOrganizationDevices(organizationId: number): MobileDeviceRegistration[] {
		return [...this.devices.values()].filter((d) => d.organizationId === organizationId);
	}
}
