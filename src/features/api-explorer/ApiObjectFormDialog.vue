<script setup lang="ts">
import { ref } from 'vue'
import { useApiObjectsStore } from './useApiObjectsStore'
import { useNotifications } from '@/shared/useNotifications'
import type { ApiObject } from '@/core/api/apiObjectsApi'

const props = defineProps<{ modelValue: boolean; object?: ApiObject }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = useApiObjectsStore()
const notifications = useNotifications()

const isEditMode = !!props.object
const submitting = ref(false)
const nameTouched = ref(false)

const name = ref(props.object?.name ?? '')

interface DataRow {
  key: string
  value: string
}

// Deliberately not a VeeValidate/Zod schema like PartFormDialog — `data` is
// an arbitrary, dynamic set of key/value rows with no fixed shape to declare
// a schema against, so a plain ref-array-driven form is the honest fit here.
const rows = ref<DataRow[]>(
  Object.entries(props.object?.data ?? {}).map(([key, value]) => ({ key, value: String(value) })),
)

function addRow(): void {
  rows.value.push({ key: '', value: '' })
}

function removeRow(index: number): void {
  rows.value.splice(index, 1)
}

/** Turns a raw row value into the closest native type, matching the mixed string/number/boolean types already present on restful-api.dev's seed data. */
function coerceValue(raw: string): unknown {
  const trimmed = raw.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed !== '' && /^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  return trimmed
}

function cancel(): void {
  emit('update:modelValue', false)
}

async function save(): Promise<void> {
  nameTouched.value = true
  const trimmedName = name.value.trim()
  if (!trimmedName || submitting.value) {
    return
  }

  const data: Record<string, unknown> = {}
  for (const row of rows.value) {
    const key = row.key.trim()
    if (key) {
      data[key] = coerceValue(row.value)
    }
  }

  submitting.value = true
  const payload = { name: trimmedName, data: Object.keys(data).length ? data : null }

  const ok = isEditMode
    ? await store.updateObject(props.object!.id, payload)
    : await store.createObject(payload)

  submitting.value = false

  if (ok) {
    notifications.success(isEditMode ? 'Object updated' : 'Object created')
    emit('update:modelValue', false)
  } else {
    notifications.error('That action failed — please try again.')
  }
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ isEditMode ? 'Edit Object' : 'Add Object' }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Name"
          variant="outlined"
          density="comfortable"
          :error-messages="nameTouched && !name.trim() ? ['Name is required'] : []"
          @blur="nameTouched = true"
        />

        <div class="object-form__data-header">
          <span>Data</span>
          <v-btn variant="text" size="small" prepend-icon="mdi-plus" @click="addRow">Add field</v-btn>
        </div>

        <p v-if="!rows.length" class="object-form__empty-hint">
          No fields yet — this object will be saved with <code>data: null</code>.
        </p>

        <div v-for="(row, index) in rows" :key="index" class="object-form__row">
          <v-text-field v-model="row.key" label="Key" variant="outlined" density="comfortable" hide-details />
          <v-text-field v-model="row.value" label="Value" variant="outlined" density="comfortable" hide-details />
          <v-btn icon="mdi-delete" variant="text" size="small" aria-label="Remove field" @click="removeRow(index)" />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="submitting" @click="cancel">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :disabled="submitting" @click="save">
          {{ submitting ? 'Saving…' : 'Save' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.object-form__data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 600;
  margin: 12px 0 4px;
}

.object-form__empty-hint {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0 0 8px;
}

.object-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  align-items: start;
  margin-bottom: 8px;
}
</style>
