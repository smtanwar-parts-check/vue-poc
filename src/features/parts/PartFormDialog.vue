<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { partsApi } from '@/core/api/partsApi'
import { useNotifications } from '@/shared/useNotifications'
import { usePartsStore } from './usePartsStore'
import { PART_CATEGORIES } from './types'
import type { Part, PartInput } from './types'
import SupplierTypeahead from './SupplierTypeahead.vue'

const props = defineProps<{ modelValue: boolean; part?: Part }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const store = usePartsStore()
const notifications = useNotifications()

const isEditMode = computed(() => !!props.part)
const submitting = ref(false)

// Checks the full dataset via the API (not just the loaded page) before
// flagging a duplicate SKU — same reasoning as the Angular build's async
// validator. Excludes the part's own id in edit mode.
const schema = toTypedSchema(
  z.object({
    sku: z
      .string()
      .trim()
      .min(3, 'SKU must be at least 3 characters')
      .max(20, 'SKU must be 20 characters or fewer')
      .superRefine(async (value, ctx) => {
        if (!value) return
        const exists = await partsApi.checkSkuExists(value, props.part?.id)
        if (exists) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This SKU is already in use' })
        }
      }),
    name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
    category: z.enum(PART_CATEGORIES),
    price: z.coerce.number().min(0.01, 'Must be greater than 0'),
    stock: z.coerce.number().min(0, "Can't be negative"),
    active: z.boolean(),
    preferredSupplier: z.string().optional(),
  }),
)

const { defineField, errors, meta, handleSubmit, validateField } = useForm({
  validationSchema: schema,
  initialValues: {
    sku: props.part?.sku ?? '',
    name: props.part?.name ?? '',
    category: props.part?.category ?? PART_CATEGORIES[0],
    price: props.part?.price ?? 0,
    stock: props.part?.stock ?? 0,
    active: props.part?.active ?? true,
    preferredSupplier: props.part?.preferredSupplier ?? '',
  },
})

// The SKU field validates on blur, not on every keystroke — its validator
// hits the network. A manual 300ms-debounced re-validate on top gives live
// feedback without hammering the API on every character, mirroring the
// Angular build's async-validator debounce.
const [sku, skuAttrs] = defineField('sku', { validateOnModelUpdate: false })
const [name, nameAttrs] = defineField('name')
const [category, categoryAttrs] = defineField('category')
const [price, priceAttrs] = defineField('price')
const [stock, stockAttrs] = defineField('stock')
const [active] = defineField('active')
const [preferredSupplier] = defineField('preferredSupplier')

let skuDebounce: ReturnType<typeof setTimeout> | undefined
watch(sku, () => {
  clearTimeout(skuDebounce)
  skuDebounce = setTimeout(() => validateField('sku'), 300)
})

function cancel(): void {
  emit('update:modelValue', false)
}

const save = handleSubmit(async (values) => {
  submitting.value = true
  const payload: PartInput = {
    sku: values.sku,
    name: values.name,
    category: values.category,
    price: values.price,
    stock: values.stock,
    active: values.active,
    preferredSupplier: values.preferredSupplier?.trim() || undefined,
  }

  const ok = isEditMode.value
    ? await store.updatePart(props.part!.id, payload)
    : await store.createPart(payload)

  submitting.value = false

  if (ok) {
    notifications.success(isEditMode.value ? 'Part updated' : 'Part created')
    emit('update:modelValue', false)
  } else {
    notifications.error('That action failed — please try again.')
  }
})
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>{{ isEditMode ? 'Edit Part' : 'Add Part' }}</v-card-title>
      <v-card-text>
        <v-form class="part-form" @submit.prevent="save">
          <v-text-field
            v-model="sku"
            v-bind="skuAttrs"
            label="SKU"
            variant="outlined"
            density="comfortable"
            :error-messages="errors.sku"
          />
          <v-text-field
            v-model="name"
            v-bind="nameAttrs"
            label="Name"
            variant="outlined"
            density="comfortable"
            :error-messages="errors.name"
          />
          <v-select
            v-model="category"
            v-bind="categoryAttrs"
            :items="PART_CATEGORIES"
            label="Category"
            variant="outlined"
            density="comfortable"
          />
          <div class="part-form__row">
            <v-text-field
              v-model.number="price"
              v-bind="priceAttrs"
              type="number"
              step="0.01"
              prefix="$"
              label="Price"
              variant="outlined"
              density="comfortable"
              :error-messages="errors.price"
            />
            <v-text-field
              v-model.number="stock"
              v-bind="stockAttrs"
              type="number"
              label="Stock"
              variant="outlined"
              density="comfortable"
              :error-messages="errors.stock"
            />
          </div>
          <SupplierTypeahead v-model="preferredSupplier" />
          <v-switch v-model="active" label="Active" color="primary" density="comfortable" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="submitting" @click="cancel">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!meta.valid || submitting"
          :loading="submitting"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.part-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.part-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 399px) {
  .part-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
