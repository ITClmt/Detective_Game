<script setup lang="ts">
import type { ResolutionQuestion } from "@repo/shared/schemas/case.schema";
import type { ResolutionAnswers } from "@repo/shared/schemas/condition.schema";
import { computed, ref } from "vue";
import { useSolveCaseMutation } from "@/queries/case.queries";

const props = defineProps<{
	slug: string;
	intro: string;
	questions: ResolutionQuestion[];
}>();

const emit = defineEmits<{
	close: [];
}>();

const answers = ref<Partial<Record<ResolutionQuestion["id"], string>>>({});
const { mutate, data: result, isLoading } = useSolveCaseMutation(props.slug);

const canSubmit = computed(() =>
	props.questions.every((question) => answers.value[question.id]),
);

function submit() {
	if (!canSubmit.value) return;
	mutate(answers.value as ResolutionAnswers);
}
</script>

<template>
	<div
		class="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6"
	>
		<div
			class="relative flex max-h-[85vh] w-full max-w-160 flex-col overflow-y-auto border border-border bg-surface-raised p-6 shadow-frame"
		>
			<button
				type="button"
				aria-label="Fermer"
				class="absolute top-3 right-3 cursor-pointer font-mono text-content-faint transition-colors duration-150 hover:text-accent"
				@click="emit('close')"
			>
				✕
			</button>

			<template v-if="!result">
				<h2 class="mb-3 font-display text-heading text-content">Résolution</h2>
				<p class="mb-5 whitespace-pre-line text-body-sm text-content-lede">
					{{ intro }}
				</p>

				<div v-for="question in questions" :key="question.id" class="mb-4.5">
					<p class="mb-2 font-mono text-label tracking-mono-wide text-accent">
						{{ question.prompt }}
					</p>
					<label
						v-for="option in question.options"
						:key="option.id"
						class="flex cursor-pointer items-center gap-2 py-1 text-body-sm text-content"
					>
						<input
							v-model="answers[question.id]"
							type="radio"
							:name="question.id"
							:value="option.id"
						>
						{{ option.label }}
					</label>
				</div>

				<button
					type="button"
					:disabled="!canSubmit || isLoading"
					class="mt-2 cursor-pointer self-start border border-accent bg-accent px-6 py-3 font-sans font-semibold text-ui text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
					@click="submit"
				>
					VALIDER LA RÉSOLUTION
				</button>
			</template>

			<template v-else>
				<h2 class="mb-1 font-mono text-label tracking-mono-wide text-accent">
					SCORE : {{ result.score }} / 3
				</h2>
				<h3 class="mb-3 font-display text-heading text-content">
					{{ result.ending.title }}
				</h3>
				<p class="mb-5 whitespace-pre-line text-body text-content-lede">
					{{ result.ending.text }}
				</p>

				<button
					type="button"
					class="cursor-pointer self-start border border-border px-5 py-2.5 font-mono text-ui text-content-faint transition-colors duration-150 hover:text-accent"
					@click="emit('close')"
				>
					FERMER
				</button>
			</template>
		</div>
	</div>
</template>
