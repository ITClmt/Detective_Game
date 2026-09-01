<script setup lang="ts">
import SceneModal from "@/components/scene/SceneModal.vue";

defineProps<{
	text: string;
}>();

const emit = defineEmits<{
	close: [];
}>();
</script>

<template>
	<SceneModal label="EXAMEN" @close="emit('close')">
		<p class="whitespace-pre-line text-body text-content">{{ text }}</p>
	</SceneModal>
</template>
