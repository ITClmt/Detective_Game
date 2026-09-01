<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

defineProps<{
	label: string;
}>();

const emit = defineEmits<{
	close: [];
}>();

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") emit("close");
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
	<div
		class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6"
	>
		<div
			class="flex max-h-[80vh] w-full max-w-160 flex-col border border-border bg-surface-raised shadow-frame"
		>
			<div
				class="flex items-center justify-between border-b border-border bg-surface-inset px-4 py-2.5"
			>
				<span
					class="font-mono text-label tracking-mono-wide text-content-faint"
				>
					{{ label }}
				</span>
				<button
					type="button"
					aria-label="Fermer"
					class="cursor-pointer font-mono text-content-faint transition-colors duration-150 hover:text-accent"
					@click="emit('close')"
				>
					✕
				</button>
			</div>

			<div class="flex-1 overflow-y-auto bg-surface p-6">
				<slot />
			</div>
		</div>
	</div>
</template>
