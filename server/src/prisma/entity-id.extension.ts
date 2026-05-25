import { Prisma } from '@prisma/client'
import { generateEntityId } from '../common/entity-id'

function ensureIdOnCreate(data: { id?: string } | undefined): void {
	if (data && !data.id) {
		data.id = generateEntityId()
	}
}

export const entityIdExtension = Prisma.defineExtension({
	name: 'entityId',
	query: {
		client: {
			create({ args, query }) {
				ensureIdOnCreate(args.data as { id?: string })
				return query(args)
			},
			upsert({ args, query }) {
				ensureIdOnCreate(args.create as { id?: string })
				return query(args)
			},
		},
		invoice: {
			create({ args, query }) {
				ensureIdOnCreate(args.data as { id?: string })
				return query(args)
			},
			upsert({ args, query }) {
				ensureIdOnCreate(args.create as { id?: string })
				return query(args)
			},
		},
		quote: {
			create({ args, query }) {
				ensureIdOnCreate(args.data as { id?: string })
				return query(args)
			},
			upsert({ args, query }) {
				ensureIdOnCreate(args.create as { id?: string })
				return query(args)
			},
		},
	},
})
