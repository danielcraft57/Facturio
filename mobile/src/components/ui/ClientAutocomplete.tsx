import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../../theme'
import { useTheme } from '../../hooks/useTheme'
import type { Client } from '../../types/client'
import { FormTextField } from './FormTextField'

function avatarColor(seed: string) {
  const palette = ['#6366F1', '#0F172A', '#EC4899', '#14B8A6', '#F59E0B']
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

interface ClientAutocompleteProps {
  query: string
  onChangeQuery: (value: string) => void
  suggestions: Client[]
  loading?: boolean
  selectedClientId: string | null
  willCreateClient: boolean
  newClientName: string
  newClientEmail: string
  createError: string | null
  creatingClient?: boolean
  onSelectClient: (client: Client) => void
  onChangeNewClientName: (value: string) => void
  onChangeNewClientEmail: (value: string) => void
  onConfirmCreateClient: () => void
  onCancelCreateClient: () => void
}

export function ClientAutocomplete({
  query,
  onChangeQuery,
  suggestions,
  loading,
  selectedClientId,
  willCreateClient,
  newClientName,
  newClientEmail,
  createError,
  creatingClient,
  onSelectClient,
  onChangeNewClientName,
  onChangeNewClientEmail,
  onConfirmCreateClient,
  onCancelCreateClient,
}: ClientAutocompleteProps) {
  const { colors: themeColors } = useTheme()
  const showList = query.trim().length >= 2 && suggestions.length > 0 && !selectedClientId

  return (
    <View>
      <Text style={[styles.label, { color: themeColors.textMuted }]}>Client</Text>
      <View style={[styles.inputRow, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
        <Feather name="search" size={16} color={themeColors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Nom ou email…"
          placeholderTextColor={themeColors.textMuted}
          style={[styles.input, { color: themeColors.text }]}
          autoCapitalize="none"
        />
        {loading ? <ActivityIndicator size="small" color={themeColors.teal} /> : null}
        <Feather name="chevron-down" size={16} color={themeColors.textMuted} />
      </View>
      <Text style={[styles.helper, { color: themeColors.textMuted }]}>
        Tapez pour rechercher. Si le client n'existe pas, créez-le ci-dessous.
      </Text>

      {showList ? (
        <View style={[styles.list, { borderColor: themeColors.border, backgroundColor: themeColors.surface }]}>
          {suggestions.map((client) => {
            const initial = (client.name?.trim()[0] ?? '?').toUpperCase()
            return (
              <Pressable
                key={client.id}
                style={[styles.option, { borderBottomColor: themeColors.border }]}
                onPress={() => onSelectClient(client)}
              >
                <View style={[styles.avatar, { backgroundColor: avatarColor(client.name) }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <View style={styles.optionBody}>
                  <Text style={[styles.optionLabel, { color: themeColors.text }]}>{client.name}</Text>
                  {client.email ? (
                    <Text style={[styles.optionHint, { color: themeColors.textMuted }]}>{client.email}</Text>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {willCreateClient ? (
        <View style={[styles.createBox, { borderColor: themeColors.border, backgroundColor: themeColors.background }]}>
          <View style={styles.createHead}>
            <Feather name="user-plus" size={16} color={themeColors.teal} />
            <Text style={[styles.createTitle, { color: themeColors.text }]}>Nouveau client</Text>
          </View>
          <FormTextField label="Nom" value={newClientName} onChangeText={onChangeNewClientName} placeholder="Raison sociale" />
          <FormTextField
            label="Email"
            value={newClientEmail}
            onChangeText={onChangeNewClientEmail}
            placeholder="client@exemple.fr"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {createError ? <Text style={styles.error}>{createError}</Text> : null}
          {!isEmail(newClientEmail) && newClientEmail.trim() ? (
            <Text style={styles.error}>Email invalide</Text>
          ) : null}
          <View style={styles.createActions}>
            <Pressable onPress={onCancelCreateClient} style={styles.linkBtn}>
              <Text style={[styles.linkText, { color: themeColors.textMuted }]}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmCreateClient}
              disabled={creatingClient || !newClientName.trim() || !isEmail(newClientEmail)}
              style={[styles.confirmBtn, { backgroundColor: themeColors.teal }, creatingClient && styles.disabled]}
            >
              <Text style={styles.confirmText}>{creatingClient ? '…' : 'Valider le client'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { ...typography.caption, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 12, ...typography.body },
  helper: { ...typography.caption, marginTop: 6 },
  list: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    maxHeight: 220,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  optionBody: { flex: 1 },
  optionLabel: { ...typography.body, fontSize: 14, fontWeight: '600' },
  optionHint: { ...typography.caption, marginTop: 2 },
  createBox: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  createHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  createTitle: { ...typography.subtitle, fontSize: 15 },
  error: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md },
  linkBtn: { paddingVertical: 8 },
  linkText: { ...typography.caption, fontWeight: '600' },
  confirmBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  confirmText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
})
