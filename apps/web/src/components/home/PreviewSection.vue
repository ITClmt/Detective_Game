<script setup lang="ts">
import crimeScene from "@/assets/case-01_crime-scene-appt.jpg";

const hotspots = [
	{ top: "68%", left: "11%", animationDelay: "0s" },
	{ top: "66%", left: "41%", animationDelay: "0.7s" },
	{ top: "42%", left: "72%", animationDelay: "1.4s" },
];

const actions = [
	{ text: "Le verre renversé", active: true },
	{ text: "La tache sur le tapis", active: false },
];
</script>

<template>
	<section
		id="apercu"
		class="border-t border-border-subtle bg-surface px-6 py-16 sm:px-8 md:py-20 lg:px-16 lg:py-30"
	>
		<div class="mx-auto max-w-shell">
			<div class="mb-13 flex items-center gap-3.5">
				<span class="font-mono text-label tracking-mono-wide text-accent">
					02 - APERÇU
				</span>
				<span class="h-px flex-1 bg-border-subtle"></span>
			</div>

			<div class="border border-border bg-surface p-3.5 shadow-frame">
				<div class="relative aspect-video overflow-hidden">
					<img
						:src="crimeScene"
						alt="Séjour d'un appartement la nuit, une lampe allumée, un verre renversé sur la table basse et une tache de sang sur le tapis"
						loading="lazy"
						class="absolute inset-0 h-full w-full object-cover"
					>

					<div
						class="pointer-events-none absolute inset-0"
						style="box-shadow: inset 0 0 180px 60px rgb(0 0 0 / 70%)"
					></div>

					<span
						v-for="(hotspot, index) in hotspots"
						:key="index"
						:style="hotspot"
						class="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 animate-hotspot rounded-full bg-accent shadow-[0_0_0_8px_var(--color-accent-glow)]"
					></span>

					<div
						class="absolute inset-x-8 bottom-7 hidden border border-border backdrop-blur-[2px] md:flex"
						style="background: rgb(12 17 23 / 96%)"
					>
						<div class="flex-1 px-6 py-5">
							<p
								class="mb-2.5 font-mono text-label tracking-mono-wide text-accent"
							>
								OBSERVATION
							</p>
							<p class="text-body text-content">
								&gt; La lampe est restée allumée. Le verre a roulé sans se
								briser - on l'a reposé là après coup.
							</p>
						</div>

						<div class="w-px bg-border"></div>

						<div class="flex w-57.5 flex-col gap-2.5 px-5.5 py-5">
							<p class="font-mono text-micro text-content-faint">EXAMINER</p>
							<p
								v-for="action in actions"
								:key="action.text"
								class="border-l-2 pl-2.5 text-[13px] leading-relaxed"
								:class="
									action.active
										? 'border-accent text-content-lede'
										: 'border-border text-content-subtle'
								"
							>
								{{ action.text }}
							</p>
						</div>
					</div>
				</div>

				<div
					class="flex items-center justify-between px-1.5 pt-3.5 font-mono text-label text-content-faint"
				>
					<span>LIEU : SÉJOUR - 23:40</span>
					<span>INDICES 3 / 7</span>
				</div>
			</div>
		</div>
	</section>
</template>
