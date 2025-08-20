import { Logger } from '@nestjs/common';

// Réduit le bruit des logs en tests e2e
// On cache les logs 'error' qui apparaissent pour des cas d'erreur attendus (ex: P2003)
Logger.overrideLogger(['log', 'warn']);


