<script setup lang="ts">
const currentYear = new Date().getFullYear();

const navLinkClass =
	"text-content-muted transition-colors duration-150 hover:text-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4";
</script>

<template>
	<footer
		class="border-t border-border-subtle bg-surface px-6 py-14 sm:px-8 lg:px-16"
	>
		<div
			class="mx-auto flex max-w-shell flex-wrap items-start justify-between gap-10"
		>
			<div>
				<p class="mb-2.5 font-display font-bold text-[20px] tracking-[0.02em]">
					TRIVIANI DETECTIVE
				</p>
				<p class="font-mono text-label text-content-faint">
					© {{ currentYear }} — Tous droits réservés
				</p>
			</div>

			<nav class="flex flex-wrap gap-9 font-mono text-label">
				<RouterLink :to="{ name: 'login' }" :class="navLinkClass">
					SE CONNECTER
				</RouterLink>
				<RouterLink
					:to="{ name: 'home', hash: '#concept' }"
					:class="navLinkClass"
				>
					LE JEU
				</RouterLink>
				<a
					href="https://itclmt.dev/contact"
					:class="navLinkClass"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="Me contacter (nouvel onglet)"
				>
					ME CONTACTER
				</a>
			</nav>
		</div>
	</footer>
</template>
