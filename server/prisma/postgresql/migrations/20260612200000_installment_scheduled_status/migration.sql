-- AlterEnum (seul statement : PostgreSQL interdit d'utiliser la nouvelle valeur enum dans la même transaction)
ALTER TYPE "InvoiceInstallmentStatus" ADD VALUE IF NOT EXISTS 'SCHEDULED' BEFORE 'PENDING';
