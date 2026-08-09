<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmLabel?: string
    destructive?: boolean
  }>(),
  { confirmLabel: 'Confirm', destructive: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

// `confirm`/`cancel` emit *before* `update:modelValue` — the parent's
// update:modelValue handler is what clears the "pending" record driving this
// dialog's own visibility, and if that fired first, `confirm`'s handler
// would read a value already nulled out from under it.
function onCancel(): void {
  emit('cancel')
  emit('update:modelValue', false)
}

function onConfirm(): void {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="onCancel">Cancel</v-btn>
        <v-btn :color="destructive ? 'error' : 'primary'" variant="flat" @click="onConfirm">
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
