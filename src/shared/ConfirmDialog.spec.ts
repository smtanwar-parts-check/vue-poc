import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ConfirmDialog from './ConfirmDialog.vue'
import vuetify from '@/plugins/vuetify'

// v-dialog teleports its content to document.body (an overlay portal), not
// into the mounted wrapper's own subtree — assertions and queries have to
// look at the document, not `wrapper`.
describe('ConfirmDialog', () => {
  const props = {
    modelValue: true,
    title: 'Delete part?',
    message: 'This permanently removes "Brake Pad" (BRK-1001).',
    confirmLabel: 'Delete',
    destructive: true,
  }

  async function mountDialog() {
    const wrapper = mount(ConfirmDialog, {
      props,
      global: { plugins: [vuetify] },
      attachTo: document.body,
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 20))
    return wrapper
  }

  it('renders the title and message passed in via props', async () => {
    const wrapper = await mountDialog()
    expect(document.body.textContent).toContain('Delete part?')
    expect(document.body.textContent).toContain('BRK-1001')
    wrapper.unmount()
  })

  it('emits confirm and closes when the confirm button is clicked', async () => {
    const wrapper = await mountDialog()
    const buttons = document.querySelectorAll('.v-card-actions button')
    const confirmButton = Array.from(buttons).find((b) => b.textContent?.includes('Delete'))
    confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    wrapper.unmount()
  })

  it('emits cancel and closes when the cancel button is clicked', async () => {
    const wrapper = await mountDialog()
    const buttons = document.querySelectorAll('.v-card-actions button')
    const cancelButton = Array.from(buttons).find((b) => b.textContent?.includes('Cancel'))
    cancelButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    wrapper.unmount()
  })
})
