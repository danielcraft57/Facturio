const MONTH_LABELS = [
	'Janvier',
	'Février',
	'Mars',
	'Avril',
	'Mai',
	'Juin',
	'Juillet',
	'Août',
	'Septembre',
	'Octobre',
	'Novembre',
	'Décembre',
];

export type ArchiveMonthGroup<T> = {
	month: number;
	monthLabel: string;
	items: T[];
};

export type ArchiveYearGroup<T> = {
	year: number;
	months: ArchiveMonthGroup<T>[];
	totalCount: number;
};

/** Regroupe des éléments archivés par année puis mois (date document). */
export function groupByYearAndMonth<T>(
	items: T[],
	getDate: (item: T) => Date | string,
): ArchiveYearGroup<T>[] {
	const byYear = new Map<number, Map<number, T[]>>();

	for (const item of items) {
		const raw = getDate(item);
		const d = raw instanceof Date ? raw : new Date(raw);
		if (Number.isNaN(d.getTime())) continue;
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		if (!byYear.has(year)) byYear.set(year, new Map());
		const byMonth = byYear.get(year)!;
		if (!byMonth.has(month)) byMonth.set(month, []);
		byMonth.get(month)!.push(item);
	}

	const years = [...byYear.keys()].sort((a, b) => b - a);
	return years.map((year) => {
		const byMonth = byYear.get(year)!;
		const months = [...byMonth.keys()]
			.sort((a, b) => b - a)
			.map((month) => ({
				month,
				monthLabel: MONTH_LABELS[month - 1] ?? String(month),
				items: byMonth.get(month)!,
			}));
		const totalCount = months.reduce((n, m) => n + m.items.length, 0);
		return { year, months, totalCount };
	});
}
