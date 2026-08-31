<script setup lang="ts">
import { ref } from "vue";
import BaseHotspot from "@/components/ui/BaseHotspot.vue";

const hub = ref({
	image: "http://s3.itclmt.dev/assets/hub/garage01.webp",
	description: "Garage",
	hotspots: [
		{
			label: "e-Mail",
			area: {
				x: 72.03,
				y: 44.22,
				w: 6.75,
				h: 12.37,
			},
		},
	],
});

function handleMailClick() {
	// TODO: fetch playerCase — pas encore d'endpoint pour lister les enquêtes
	// d'un joueur (seulement GET /cases/:slug/progress, qui prend déjà un slug
	// connu). Une fois cet endpoint dispo côté API, appeler `api()` (@/lib/http)
	// ici pour charger la boîte mail avant de naviguer dessus.
}
</script>

<template>
	<main class="flex h-screen w-screen items-center justify-center p-6 md:p-10">
		<div
			class="relative overflow-hidden border border-border bg-surface-raised shadow-frame"
		>
			<img
				:src="hub.image"
				:alt="hub.description"
				class="block h-auto w-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100dvw-5rem)] object-contain"
			>

			<BaseHotspot
				v-for="hotspot in hub.hotspots"
				:key="hotspot.label"
				:label="hotspot.label"
				:area="hotspot.area"
				@click="handleMailClick"
			/>
		</div>
	</main>
</template>
