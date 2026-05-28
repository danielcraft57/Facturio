import { computeReformSchedule } from './reform-schedule.util';

describe('computeReformSchedule', () => {
	it('micro: émission en 2027', () => {
		const r = computeReformSchedule('micro');
		expect(r.emissionDate).toBe('2027-09-01');
		expect(r.receptionDate).toBe('2026-09-01');
		expect(r.milestones).toHaveLength(3);
	});

	it('eti: émission en 2026', () => {
		const r = computeReformSchedule('eti');
		expect(r.emissionDate).toBe('2026-09-01');
	});

	it('défaut = micro', () => {
		const r = computeReformSchedule();
		expect(r.companySize).toBe('micro');
	});
});
