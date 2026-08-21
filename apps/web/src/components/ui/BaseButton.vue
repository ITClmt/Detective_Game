<script setup lang="ts">
const { loading = false, disabled = false } = defineProps<{
	loading?: boolean;
	disabled?: boolean;
}>();
</script>

<template>
	<button
		type="submit"
		:disabled="disabled || loading"
		:aria-busy="loading"
		class="w-full border py-4 font-sans font-semibold text-ui tracking-cta transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent-hover focus-visible:outline-offset-[3px]"
		:class="
			disabled || loading
				? 'cursor-not-allowed border-accent/25 bg-accent/25 text-content-faint'
				: 'border-accent bg-accent text-accent-contrast hover:border-accent-hover hover:bg-accent-hover cursor-pointer'
		"
	>
		<slot />
		<span v-if="loading" class="ml-2 font-mono">...</span>
	</button>
</template>
