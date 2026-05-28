/**
 * Précharge factures / devis après connexion pour accélérer le tableau de bord et les listes.
 */
export async function warmAppDataAfterLogin(): Promise<void> {
  const [{ useInvoicesStore }, { useQuotesStore }] = await Promise.all([
    import('../stores/invoicesStore'),
    import('../stores/quotesStore'),
  ])

  await Promise.allSettled([
    useInvoicesStore.getState().fetchInvoices({
      folder: 'inbox',
      limit: 50,
      includeFolderCounts: true,
    }),
    useQuotesStore.getState().fetchQuotes({ folder: 'inbox' }, 1),
  ])
}
