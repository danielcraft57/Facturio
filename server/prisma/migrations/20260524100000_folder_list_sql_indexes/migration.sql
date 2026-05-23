-- Index composites pour listes paginées par dossier (multi-tenant + archivedAt + tri/filtres)

-- Client : inbox, actifs/inactifs/prospects, entreprises/particuliers
CREATE INDEX "Client_organizationId_createdAt_idx" ON "Client"("organizationId", "createdAt");
CREATE INDEX "Client_organizationId_status_createdAt_idx" ON "Client"("organizationId", "status", "createdAt");
CREATE INDEX "Client_organizationId_isCompany_createdAt_idx" ON "Client"("organizationId", "isCompany", "createdAt");

-- Facture : pagination dossiers + compteurs sidebar + agrégat CA par client
CREATE INDEX "Invoice_organizationId_archivedAt_createdAt_idx" ON "Invoice"("organizationId", "archivedAt", "createdAt");
CREATE INDEX "Invoice_organizationId_archivedAt_status_idx" ON "Invoice"("organizationId", "archivedAt", "status");
CREATE INDEX "Invoice_organizationId_archivedAt_seenAt_idx" ON "Invoice"("organizationId", "archivedAt", "seenAt");
CREATE INDEX "Invoice_organizationId_archivedAt_snoozedUntil_idx" ON "Invoice"("organizationId", "archivedAt", "snoozedUntil");
CREATE INDEX "Invoice_organizationId_archivedAt_starred_idx" ON "Invoice"("organizationId", "archivedAt", "starred");
CREATE INDEX "Invoice_organizationId_archivedAt_important_idx" ON "Invoice"("organizationId", "archivedAt", "important");
CREATE INDEX "Invoice_organizationId_clientId_status_idx" ON "Invoice"("organizationId", "clientId", "status");

-- Devis : pagination dossiers (index simples manquants + composites org)
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Quote_number_idx" ON "Quote"("number");
CREATE INDEX "Quote_snoozedUntil_idx" ON "Quote"("snoozedUntil");
CREATE INDEX "Quote_seenAt_idx" ON "Quote"("seenAt");
CREATE INDEX "Quote_sentAt_idx" ON "Quote"("sentAt");
CREATE INDEX "Quote_organizationId_archivedAt_createdAt_idx" ON "Quote"("organizationId", "archivedAt", "createdAt");
CREATE INDEX "Quote_organizationId_archivedAt_status_idx" ON "Quote"("organizationId", "archivedAt", "status");
CREATE INDEX "Quote_organizationId_archivedAt_seenAt_idx" ON "Quote"("organizationId", "archivedAt", "seenAt");
CREATE INDEX "Quote_organizationId_archivedAt_snoozedUntil_idx" ON "Quote"("organizationId", "archivedAt", "snoozedUntil");
CREATE INDEX "Quote_organizationId_archivedAt_starred_idx" ON "Quote"("organizationId", "archivedAt", "starred");
CREATE INDEX "Quote_organizationId_archivedAt_important_idx" ON "Quote"("organizationId", "archivedAt", "important");
