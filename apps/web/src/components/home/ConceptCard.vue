<script setup lang="ts">
const card = defineProps<{ kicker: string; title: string; text: string }>();
</script>

<template>
	<div class="bg-surface-raised px-8 py-9.5">
		<p class="mb-5.5 font-mono text-label tracking-mono-wide text-accent">
			{{ card.kicker }}
		</p>
		<h3 class="mb-3.5 font-display font-semibold text-subheading">
			{{ card.title }}
		</h3>
		<p class="text-body-sm text-content-muted">{{ card.text }}</p>
	</div>
</template>
