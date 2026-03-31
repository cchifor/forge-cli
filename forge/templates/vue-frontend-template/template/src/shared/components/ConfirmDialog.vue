<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'default' | 'destructive'
  }>(),
  {
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'destructive',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" @click="handleCancel">
            {{ cancelLabel }}
          </Button>
        </DialogClose>
        <Button :variant="variant" @click="handleConfirm">
          {{ confirmLabel }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
