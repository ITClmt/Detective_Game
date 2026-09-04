<script setup lang="ts">
import { computed } from "vue";
import type { PlayableCase } from "@/queries/cases.queries";
import { useCaseBySlugQuery } from "@/queries/cases.queries";

const props = defineProps<{
	mail: PlayableCase;
}>();

const emit = defineEmits<{
	back: [];
	accept: [slug: string];
	resolve: [slug: string];
}>();

const { data: caseFile, isLoading } = useCaseBySlugQuery(props.mail.slug);

const briefing = computed(() => caseFile.value?.content.briefing);
</script>

<template>
	<div class="flex flex-1 flex-col gap-4 overflow-y-auto bg-white p-5">
		<button
			type="button"
			class="cursor-pointer self-start font-mono text-label tracking-mono-wide text-neutral-400 transition-colors duration-150 hover:text-neutral-900"
			@click="emit('back')"
		>
			&lt; RETOUR
		</button>

		<p v-if="isLoading" class="text-body-sm text-neutral-400">Chargement...</p>

		<div
			v-else-if="briefing"
			class="flex flex-col gap-4 border border-neutral-200 p-5 text-neutral-900"
		>
			<div class="border-b border-neutral-200 pb-3">
				<p class="text-body-sm text-neutral-500">
					De : {{ briefing.senderName }} &lt;{{ briefing.from }}&gt;
				</p>
				<p class="mt-1 font-display text-body-lg">{{ briefing.subject }}</p>
			</div>
			<p class="whitespace-pre-line text-body-sm leading-relaxed">
				{{ briefing.body }}
			</p>
		</div>

		<div class="flex gap-2">
			<button
				v-if="!mail.started"
				type="button"
				class="cursor-pointer border border-accent bg-accent px-4 py-2 font-sans font-semibold text-ui text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover"
				@click="emit('accept', mail.slug)"
			>
				ACCEPTER
			</button>

			<template v-else>
				<button
					type="button"
					class="cursor-pointer border border-accent bg-accent px-4 py-2 font-sans font-semibold text-ui text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover"
					@click="emit('accept', mail.slug)"
				>
					CONTINUER
				</button>
				<button
					type="button"
					class="cursor-pointer border border-accent px-4 py-2 font-mono text-label tracking-mono-wide text-accent transition-colors duration-150 hover:bg-accent hover:text-accent-contrast"
					@click="emit('resolve', mail.slug)"
				>
					RÉPONDRE
				</button>
			</template>
		</div>
	</div>
</template>
