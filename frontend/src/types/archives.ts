export type ArchiveMonthGroup<T> = {
  month: number
  monthLabel: string
  items: T[]
}

export type ArchiveYearGroup<T> = {
  year: number
  months: ArchiveMonthGroup<T>[]
  totalCount: number
}

export type ArchivedListResponse<T> = {
  groups: ArchiveYearGroup<T>[]
  total: number
}
