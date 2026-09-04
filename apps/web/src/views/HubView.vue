<script setup lang="ts">
import { ref } from "vue";
import MailboxModal from "@/components/hub/MailboxModal.vue";
import BaseHotspot from "@/components/ui/BaseHotspot.vue";
import HotspotDebugOverlay from "@/components/ui/HotspotDebugOverlay.vue";
import { useHotspotDebug } from "@/composables/useHotspotDebug";

const { debugMode } = useHotspotDebug();
const mailBox = ref(false);

const hub = ref({
	image: "http://s3.itclmt.dev/assets/hub/garage01.webp",
	description: "Garage",
	hotspots: [
		{
			label: "E-Mail",
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
	mailBox.value = true;
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
				:hover="false"
				@click="handleMailClick"
			/>

			<div
				class="pointer-events-none absolute right-3 bottom-3 z-10 font-mono text-micro text-content-ghost"
			>
				D = debug hotspots ({{ debugMode ? "ON" : "off" }})
			</div>

			<HotspotDebugOverlay v-if="debugMode" />
		</div>

		<MailboxModal v-model:open="mailBox" />
	</main>
</template>
