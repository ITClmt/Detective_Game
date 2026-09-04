<script setup lang="ts">
import { evaluateCondition } from "@repo/shared/game/engine";
import { computed, ref } from "vue";
import SceneModal from "@/components/scene/SceneModal.vue";
import {
	useCaseBySlugQuery,
	useCaseProgressQuery,
	useSolveCaseMutation,
} from "@/queries/cases.queries";

const props = defineProps<{
	slug: string;
}>();

const emit = defineEmits<{
	close: [];
}>();

const { data: caseFile } = useCaseBySlugQuery(props.slug);
const { data: saveProgress } = useCaseProgressQuery(props.slug);
const { mutate: solveCase, data: result } = useSolveCaseMutation(props.slug);

const resolution = computed(() => caseFile.value?.content.resolution);

const unlocked = computed(() => {
	if (!resolution.value || !saveProgress.value) return false;
	return evaluateCondition(
		resolution.value.unlockWhen,
		saveProgress.value.state,
	);
});

const answers = ref({ culprit: "", motive: "", method: "" });

function submit() {
	solveCase({ ...answers.value });
}
</script>

<template>
	<SceneModal label="RÉSOUDRE" @close="emit('close')">
		<p
			v-if="!resolution || !saveProgress"
			class="text-body-sm text-content-faint"
		>
			Chargement...
		</p>

		<p v-else-if="!unlocked" class="text-body-sm text-content-lede">
			{{ resolution.lockedText }}
		</p>

		<div v-else-if="!result" class="flex flex-col gap-5">
			<p class="text-body-sm text-content-lede">{{ resolution.intro }}</p>

			<div
				v-for="question in resolution.questions"
				:key="question.id"
				class="flex flex-col gap-2"
			>
				<p class="font-mono text-label tracking-mono-wide text-content-faint">
					{{ question.prompt }}
				</p>
				<div class="flex flex-col gap-1.5">
					<button
						v-for="option in question.options"
						:key="option.id"
						type="button"
						class="cursor-pointer border px-3 py-2 text-left text-body-sm transition-colors duration-150"
						:class="
							answers[question.id] === option.id
								? 'border-accent bg-accent text-accent-contrast'
								: 'border-border text-content-lede hover:bg-surface-inset'
						"
						@click="answers[question.id] = option.id"
					>
						{{ option.label }}
					</button>
				</div>
			</div>

			<button
				type="button"
				:disabled="!answers.culprit || !answers.motive || !answers.method"
				class="cursor-pointer border border-accent bg-accent px-4 py-2 font-sans font-semibold text-ui text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
				@click="submit"
			>
				ACCUSER
			</button>
		</div>

		<div v-else class="flex flex-col gap-3">
			<p class="font-mono text-label tracking-mono-wide text-accent">
				{{ result.ending.title }}
				— {{ result.score }}/3
			</p>
			<p class="whitespace-pre-line text-body text-content">
				{{ result.ending.text }}
			</p>
		</div>
	</SceneModal>
</template>
