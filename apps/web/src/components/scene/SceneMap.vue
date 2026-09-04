<script setup lang="ts">
import type { Scene } from "@repo/shared/schemas/case.schema";
import { useRouter } from "vue-router";
import SceneModal from "@/components/scene/SceneModal.vue";

defineProps<{
	scenes: Scene[];
	currentSceneId: string;
}>();

const emit = defineEmits<{
	select: [sceneId: string];
	close: [];
}>();

const router = useRouter();

function goToHub() {
	router.push({ name: "hub" });
}
</script>

<template>
	<SceneModal label="CARTE" @close="emit('close')">
		<ol class="relative flex flex-col gap-6 pl-6">
			<div class="absolute top-2 bottom-2 left-1.75 w-px bg-border"></div>

			<li class="relative">
				<span
					class="absolute top-1 -left-6 h-3.5 w-3.5 rounded-full border-2 border-content-faint bg-surface"
				></span>

				<button
					type="button"
					class="w-full cursor-pointer text-left"
					@click="goToHub"
				>
					<p class="font-mono text-label tracking-mono-wide text-content-faint">
						BUREAU
					</p>
					<p class="mt-1 text-body-sm text-content-lede">Retour au bureau.</p>
				</button>
			</li>

			<li v-for="scene in scenes" :key="scene.id" class="relative">
				<span
					class="absolute top-1 -left-6 h-3.5 w-3.5 rounded-full border-2 border-accent"
					:class="scene.id === currentSceneId ? 'bg-accent' : 'bg-surface'"
				></span>

				<button
					type="button"
					:disabled="scene.id === currentSceneId"
					class="w-full text-left disabled:cursor-not-allowed enabled:cursor-pointer"
					@click="emit('select', scene.id)"
				>
					<p
						class="font-mono text-label tracking-mono-wide"
						:class="scene.id === currentSceneId ? 'text-accent' : 'text-content'"
					>
						{{ scene.name }}
					</p>
					<p class="mt-1 text-body-sm text-content-lede">{{ scene.intro }}</p>
				</button>
			</li>
		</ol>
	</SceneModal>
</template>
