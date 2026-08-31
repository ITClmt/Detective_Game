<script setup lang="ts">
defineProps<{
	text: string;
}>();

const emit = defineEmits<{
	close: [];
}>();
</script>

<template>
	<div
		class="absolute inset-x-8 bottom-7 z-20 border border-border backdrop-blur-[2px]"
		style="background: rgb(12 17 23 / 96%)"
	>
		<div class="px-6 py-5">
			<div class="mb-2.5 flex items-center justify-between">
				<p class="font-mono text-label tracking-mono-wide text-accent">
					EXAMEN
				</p>
				<button
					type="button"
					aria-label="Fermer"
					class="cursor-pointer font-mono text-content-faint transition-colors duration-150 hover:text-accent"
					@click="emit('close')"
				>
					✕
				</button>
			</div>

			<p class="whitespace-pre-line text-body text-content">&gt; {{ text }}</p>
		</div>
	</div>
</template>
