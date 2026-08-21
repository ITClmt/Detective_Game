<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import LoginForm from "@/components/auth/LoginForm.vue";
import RegisterForm from "@/components/auth/RegisterForm.vue";

const route = useRoute();

const tabs = [
	{ name: "login", label: "CONNEXION" },
	{ name: "register", label: "INSCRIPTION" },
];

const isLogin = computed(() => route.name === "login");

const heading = computed(() =>
	isLogin.value ? "Reprendre l'enquête" : "Ouvrir un dossier",
);

const subheading = computed(() =>
	isLogin.value
		? "Vos dossiers en cours vous attendent."
		: "Votre première affaire commence tout de suite.",
);

const activeTabClass = "bg-surface-raised border-accent text-accent";
const inactiveTabClass =
	"bg-surface-inset border-transparent text-content-subtle hover:text-content-muted";
</script>

<template>
	<div
		class="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
	>
		<div
			class="pointer-events-none absolute inset-0"
			style="background: radial-gradient(70% 55% at 50% 0%, rgb(227 181 99 / 11%), transparent 62%)"
		></div>
		<div
			class="pointer-events-none absolute inset-0"
			style="background: repeating-linear-gradient(135deg, rgb(255 255 255 / 1.4%) 0 14px, transparent 14px 28px)"
		></div>
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 h-190 w-190 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/7"
		></div>
		<div
			class="pointer-events-none absolute top-1/2 left-1/2 h-130 w-130 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/5"
		></div>
		<div class="vignette"></div>

		<div class="relative w-full max-w-card">
			<header class="mb-8.5 text-center">
				<RouterLink
					:to="{ name: 'home' }"
					class="font-display font-bold text-[26px] tracking-[0.04em] text-content transition-colors duration-150 hover:text-accent"
				>
					TRIVIANI DETECTIVE
				</RouterLink>
				<p
					class="mt-2.5 font-mono text-label tracking-mono-wide text-content-faint"
				>
					ACCÈS AU DOSSIER
				</p>
			</header>

			<div
				class="border border-border bg-surface-raised"
				style="box-shadow: var(--shadow-card), inset 0 0 0 1px rgb(255 255 255 / 2%)"
			>
				<div class="grid grid-cols-2 border-b border-border">
					<RouterLink
						v-for="tab in tabs"
						:key="tab.name"
						:to="{ name: tab.name }"
						class="border-b-2 py-4.5 text-center font-mono text-label transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2"
						:class="route.name === tab.name ? activeTabClass : inactiveTabClass"
					>
						{{ tab.label }}
					</RouterLink>
				</div>

				<div class="p-9">
					<h1 class="mb-2 font-display font-semibold text-heading">
						{{ heading }}
					</h1>
					<p class="text-ui text-content-subtle">{{ subheading }}</p>

					<div class="mt-6">
						<LoginForm v-if="isLogin" />
						<RegisterForm v-else />
					</div>
				</div>
			</div>

			<p class="mt-6.5 text-center">
				<RouterLink
					:to="{ name: 'home' }"
					class="font-mono text-label text-content-faint transition-colors duration-150 hover:text-accent"
				>
					← RETOUR À L'ACCUEIL
				</RouterLink>
			</p>
		</div>
	</div>
</template>
