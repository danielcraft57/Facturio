export type DocumentFolderRailBulkSlot = {
  checked: boolean
  visible: boolean
  onToggle: () => void
  ariaLabel?: string
}

type SelectionLike = {
  isSelected: (id: string | number) => boolean
  selectionActive: boolean
  toggle: (id: string | number) => void
}

export function buildDocumentFolderRailBulkSlot(
  selection: SelectionLike,
  id: string | number,
  ariaLabel: string,
): DocumentFolderRailBulkSlot {
  return {
    checked: selection.isSelected(id),
    visible: selection.selectionActive,
    onToggle: () => selection.toggle(id),
    ariaLabel,
  }
}
