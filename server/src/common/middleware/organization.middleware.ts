import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class OrganizationMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		// Si l'utilisateur est authentifié, ajouter organizationId à la requête
		if (req.user && (req.user as any).organizationId) {
			(req as any).organizationId = (req.user as any).organizationId;
		}
		next();
	}
}

