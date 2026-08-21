<script setup lang="ts"></script>

<template
	><section
		class="relative flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center sm:px-8 lg:px-16"
	>
		<div class="lamp-glow"></div>

		<div class="relative max-w-3xl">
			<p class="mb-10 font-mono text-meta tracking-mono-wide text-accent">
				Work in progress
			</p>

			<h1
				class="mb-7 font-display font-bold text-[56px] leading-[0.9] tracking-tight-display sm:text-[84px] lg:text-hero"
			>
				TRIVIANI DETECTIVE
			</h1>

			<p
				class="mx-auto mb-3 max-w-[36ch] text-[16px] lg:text-lede text-content-lede sm:text-[20px]"
			>
				Incarnez un détective privé. Explorez les lieux, interrogez les
				suspects, résolvez l'enquête.
			</p>

			<p class="mb-11 font-mono text-meta tracking-cta text-content-subtle">
				Jeu d'enquête point-and-click - jouable dans le navigateur.
			</p>

			<RouterLink
				:to="{ name: 'register' }"
				class="inline-flex items-center gap-3 border border-accent bg-accent px-8.5 py-4.5 font-sans font-semibold text-ui tracking-cta text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent-hover focus-visible:outline-offset-[3px]"
			>
				COMMENCER L'ENQUÊTE
				<span class="font-mono text-meta">→</span>
			</RouterLink>
		</div>
	</section></template
>
