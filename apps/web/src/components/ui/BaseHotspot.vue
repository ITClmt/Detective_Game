<script setup lang="ts">
import type { HotspotArea } from "@repo/shared/schemas/case.schema";

defineProps<{
	label: string;
	area: HotspotArea;
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
			class="absolute inset-0 cursor-pointer bg-[radial-gradient(circle,var(--color-accent-glow)_0%,transparent_60%)] opacity-0 transition-opacity duration-300 ease-out hover:opacity-70"
			@click="emit('click')"
		></button>

		<span
			class="pointer-events-none absolute top-0 left-0 h-3.5 w-3.5 -translate-x-1 -translate-y-1 border-t-2 border-l-2 border-accent opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
		></span>
		<span
			class="pointer-events-none absolute top-0 right-0 h-3.5 w-3.5 translate-x-1 -translate-y-1 border-t-2 border-r-2 border-accent opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
		></span>
		<span
			class="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 -translate-x-1 translate-y-1 border-b-2 border-l-2 border-accent opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
		></span>
		<span
			class="pointer-events-none absolute right-0 bottom-0 h-3.5 w-3.5 translate-x-1 translate-y-1 border-r-2 border-b-2 border-accent opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100"
		></span>

		<span
			class="pointer-events-none absolute top-full left-1/2 mt-2 -translate-x-1/2 font-mono text-label tracking-mono-wide whitespace-nowrap text-accent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
		>
			{{ label }}
		</span>
	</div>
</template>
