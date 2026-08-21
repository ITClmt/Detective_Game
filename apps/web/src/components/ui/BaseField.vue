<script setup lang="ts">
import { computed, useId } from "vue";

const model = defineModel<string>({ required: true });

const {
	label,
	type = "text",
	autocomplete,
	placeholder,
	hint,
	error,
} = defineProps<{
	label: string;
	type?: string;
	autocomplete?: string;
	placeholder?: string;
	hint?: string;
	error?: string;
}>();

const id = useId();
const hintId = `${id}-hint`;
const errorId = `${id}-error`;

const describedBy = computed(() => {
	const ids: string[] = [];
	if (hint) ids.push(hintId);
	if (error) ids.push(errorId);
	return ids.length > 0 ? ids.join(" ") : undefined;
});
</script>

<template>
	<div class="flex flex-col gap-2.25">
		<label :for="id" class="font-mono text-label text-content-muted">
			{{ label }}
		</label>

		<input
			:id="id"
			v-model="model"
			:type="type"
			:autocomplete="autocomplete"
			:placeholder="placeholder"
			:aria-describedby="describedBy"
			:aria-invalid="error ? true : undefined"
			class="border bg-surface-inset px-3.75 py-3.5 text-body-sm text-content transition-colors duration-150 placeholder:text-content-ghost focus:outline-none"
			:class="[
				error ? 'border-danger' : 'border-border focus:border-accent',
				{ 'tracking-[0.08em]': type === 'password' },
			]"
		>

		<p
			v-if="hint"
			:id="hintId"
			class="font-mono text-[11px] leading-relaxed text-content-faint"
		>
			{{ hint }}
		</p>

		<p
			v-if="error"
			:id="errorId"
			class="font-mono text-[11px] leading-relaxed text-danger"
		>
			&gt; {{ error }}
		</p>
	</div>
</template>
