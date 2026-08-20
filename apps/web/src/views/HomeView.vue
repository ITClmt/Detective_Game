<script setup lang="ts">
import TheFooter from "@/components/TheFooter.vue";
import TheHero from "@/components/ui/TheHero.vue";

const conceptCards = [
	{
		kicker: "QUI",
		title: "Explorer les lieux",
		text: "Des scènes fixes, fouillées au clic. Objets déplaçables, tiroirs fermés, détails qui n'ont rien à faire là.",
	},
	{
		kicker: "POURQUOI",
		title: "Interroger les suspects",
		text: "Les questions disponibles dépendent de ce que vous avez trouvé. Confrontez un témoin pour découvrir ses secrets.",
	},
	{
		kicker: "COMMENT",
		title: "Résoudre par déduction",
		text: "Nommez le coupable, le mobile et la méthode. Une accusation sans preuve reste une accusation.",
	},
];
</script>

<template>
	<TheHero />
	<section
		id="concept"
		class="min-h-screen border-t border-border-subtle bg-surface-alt px-6 py-16 sm:px-8 md:py-20 lg:px-16 lg:py-30"
	>
		<div class="mx-auto max-w-shell">
			<div class="mb-13 flex items-center gap-3.5">
				<span class="font-mono text-label tracking-mono-wide text-accent"
					>01 — LE CONCEPT</span
				>
				<span class="h-px flex-1 bg-border-subtle"></span>
			</div>

			<h2 class="mb-6 max-w-[24ch] font-display font-semibold text-title">
				Une affaire se résout par la déduction, pas par le hasard.
			</h2>
			<p class="mb-18 max-w-[62ch] text-body-lg text-content-muted">
				Chaque enquête est un ensemble fermé : un lieu, des témoins, des indices
				matériels. Tout ce qu'il faut pour conclure est là. À vous de relier les
				éléments.
			</p>

			<div
				class="grid grid-cols-1 gap-px border border-border-subtle bg-border-subtle md:grid-cols-3"
			>
				<div
					v-for="card in conceptCards"
					:key="card.kicker"
					class="bg-surface-raised px-8 py-9.5"
				>
					<p class="mb-5.5 font-mono text-label tracking-mono-wide text-accent">
						{{ card.kicker }}
					</p>
					<h3 class="mb-3.5 font-display font-semibold text-subheading">
						{{ card.title }}
					</h3>
					<p class="text-body-sm text-content-muted">{{ card.text }}</p>
				</div>
			</div>
		</div>
	</section>
	<TheFooter />
</template>
