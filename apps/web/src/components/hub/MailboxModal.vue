<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { usePlayableCasesQuery } from "@/queries/cases.queries";

const router = useRouter();

const props = defineProps<{
	open: boolean;
}>();

const emit = defineEmits<{
	"update:open": [value: boolean];
}>();

const { data, isLoading, error } = usePlayableCasesQuery();

// Ordre d'apparition dans la boîte mail, pas l'ordre de retour de l'API.
const mails = computed(() =>
	[...(data.value ?? [])].sort((a, b) => a.order - b.order),
);

function close() {
	emit("update:open", false);
}

function openCase(slug: string) {
	close();
	router.push({ name: "case", params: { slug } });
}

// Le clic sur le fond fermerait la modale sans équivalent clavier (règle
// a11y de Biome) : Échap est le seul moyen clavier de fermer, en plus de la
// croix.
function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape" && props.open) close();
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));
</script>

<template>
	<Transition name="fade">
		<div
			v-if="open"
			class="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-6"
		>
			<div
				class="flex max-h-[80vh] w-full max-w-160 flex-col border border-border bg-surface-raised shadow-frame"
			>
				<div
					class="flex items-center justify-between border-b border-border bg-surface-inset px-4 py-2.5"
				>
					<span
						class="font-mono text-label tracking-mono-wide text-content-faint"
					>
						BOÎTE MAIL
					</span>
					<button
						type="button"
						aria-label="Fermer"
						class="cursor-pointer font-mono text-content-faint transition-colors duration-150 hover:text-accent"
						@click="close"
					>
						✕
					</button>
				</div>

				<div class="flex-1 overflow-y-auto bg-surface">
					<p
						v-if="isLoading"
						class="p-6 text-center font-mono text-body-sm text-content-faint"
					>
						Chargement...
					</p>

					<p
						v-else-if="error"
						class="p-6 text-center font-mono text-body-sm text-danger"
					>
						Impossible de charger la boîte mail.
					</p>

					<p
						v-else-if="mails.length === 0"
						class="p-6 text-center font-mono text-body-sm text-content-faint"
					>
						Aucune enquête disponible pour le moment.
					</p>

					<ul v-else class="divide-y divide-border-subtle">
						<li v-for="mail in mails" :key="mail.slug">
							<button
								type="button"
								class="flex w-full cursor-pointer gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-surface-inset"
								@click="openCase(mail.slug)"
							>
								<img
									:src="mail.coverImage"
									:alt="mail.title"
									class="h-14 shrink-0 border border-border object-cover"
								>

								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="truncate font-display text-body-lg text-content">
											{{ mail.title }}
										</p>
										<span
											v-if="mail.started"
											class="shrink-0 font-mono text-micro tracking-mono text-accent"
										>
											EN COURS
										</span>
									</div>
									<p class="line-clamp-2 text-body-sm text-content-lede">
										{{ mail.description }}
									</p>
								</div>
							</button>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s var(--ease-out);
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
