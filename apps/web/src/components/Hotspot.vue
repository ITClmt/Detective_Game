<script setup lang="ts">
defineProps<{
	label: string;
	area: {
		x: number;
		y: number;
		w: number;
		h: number;
	};
}>();

const emit = defineEmits<{
	click: [];
}>();
</script>

<template>
	<div
		class="group absolute"
		:style="{
			top: `${area.y}%`,
			left: `${area.x}%`,
			width: `${area.w}%`,
			height: `${area.h}%`,
		}"
	>
		<button
			type="button"
			:aria-label="label"
			class="absolute inset-0 cursor-pointer rounded-full bg-transparent transition-shadow duration-300 ease-out hover:shadow-[0_0_36px_16px_var(--color-accent-glow)]"
			@click="emit('click')"
		></button>

		<span
			class="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 font-mono text-label tracking-mono-wide whitespace-nowrap text-accent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
		>
			{{ label }}
		</span>
	</div>
</template>
