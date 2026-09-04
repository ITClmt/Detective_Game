<script setup lang="ts">
import type { CaseItem } from "@repo/shared/schemas/case.schema";
import { computed, ref } from "vue";
import SceneModal from "@/components/scene/SceneModal.vue";

const props = defineProps<{
	items: CaseItem[];
}>();

const emit = defineEmits<{
	close: [];
}>();

const selectedId = ref<string | null>(null);

const selectedItem = computed(() =>
	props.items.find((item) => item.id === selectedId.value),
);
</script>

<template>
	<SceneModal label="INVENTAIRE" @close="emit('close')">
		<div v-if="selectedItem" class="flex flex-col gap-4">
			<button
				type="button"
				class="cursor-pointer self-start font-mono text-label tracking-mono-wide text-content-faint transition-colors duration-150 hover:text-accent"
				@click="selectedId = null"
			>
				&lt; RETOUR
			</button>

			<img
				:src="selectedItem.image"
				:alt="selectedItem.label"
				class="mx-auto h-56 w-auto object-contain"
			>

			<p class="font-mono text-label tracking-mono-wide text-content">
				{{ selectedItem.label }}
			</p>
			<p class="text-body-sm text-content-lede">
				{{ selectedItem.description }}
			</p>
		</div>

		<p v-else-if="items.length === 0" class="text-body-sm text-content-faint">
			Aucun objet récupéré pour l'instant.
		</p>

		<div v-else class="grid grid-cols-3 gap-3">
			<button
				v-for="item in items"
				:key="item.id"
				type="button"
				class="flex cursor-pointer flex-col items-center gap-2 border border-border p-2 text-center transition-colors duration-150 hover:bg-surface-inset"
				@click="selectedId = item.id"
			>
				<img
					:src="item.image"
					:alt="item.label"
					class="h-16 w-16 object-contain"
				>
				<p class="text-micro text-content-lede">{{ item.label }}</p>
			</button>
		</div>
	</SceneModal>
</template>
