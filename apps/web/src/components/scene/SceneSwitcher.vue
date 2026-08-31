<script setup lang="ts">
import { isSceneUnlocked } from "@repo/shared/game/engine";
import type { PlayerState } from "@repo/shared/game/state";
import type { Scene } from "@repo/shared/schemas/case.schema";
import { computed } from "vue";

const props = defineProps<{
	scenes: Scene[];
	state: PlayerState;
}>();

const emit = defineEmits<{
	select: [sceneId: string];
}>();

const unlocked = computed(() =>
	props.scenes.filter((scene) => isSceneUnlocked(scene, props.state)),
);
</script>

<template>
	<div
		class="absolute top-3 left-3 z-10 flex flex-col gap-1 border border-border bg-surface-raised/90 p-2 backdrop-blur-[2px]"
	>
		<button
			v-for="scene in unlocked"
			:key="scene.id"
			type="button"
			class="cursor-pointer px-2.5 py-1.5 text-left font-mono text-micro whitespace-nowrap transition-colors duration-150"
			:class="
				scene.id === state.currentSceneId
					? 'text-accent'
					: 'text-content-faint hover:text-content'
			"
			@click="emit('select', scene.id)"
		>
			{{ scene.name }}
		</button>
	</div>
</template>
