<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import MailDetail from "@/components/hub/MailDetail.vue";
import ResolutionModal from "@/components/hub/ResolutionModal.vue";
import { usePlayableCasesQuery } from "@/queries/cases.queries";

const router = useRouter();

const props = defineProps<{
	open: boolean;
}>();

const emit = defineEmits<{
	"update:open": [value: boolean];
}>();

const { data, isLoading, error } = usePlayableCasesQuery();

const openMailSlug = ref<string | null>(null);

// Ordre d'apparition dans la boîte mail, pas l'ordre de retour de l'API.
const mails = computed(() =>
	[...(data.value ?? [])].sort((a, b) => a.order - b.order),
);

function close() {
	emit("update:open", false);
	openMailSlug.value = null;
}

const openMail = computed(() =>
	mails.value.find((mail) => mail.slug === openMailSlug.value),
);

function handleAccept(slug: string) {
	close();
	router.push({ name: "case", params: { slug } });
}

const activeResolutionSlug = ref<string | null>(null);

function handleResolve(slug: string) {
	activeResolutionSlug.value = slug;
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
				class="flex max-h-[80vh] w-full max-w-160 flex-col border border-neutral-200 bg-white shadow-xl"
			>
				<div
					class="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2.5"
				>
					<span
						class="font-mono text-label tracking-mono-wide text-neutral-500"
					>
						BOÎTE MAIL
					</span>
					<button
						type="button"
						aria-label="Fermer"
						class="cursor-pointer text-neutral-400 transition-colors duration-150 hover:text-neutral-900"
						@click="close"
					>
						✕
					</button>
				</div>

				<div v-if="!openMail" class="flex-1 overflow-y-auto bg-white">
					<p
						v-if="isLoading"
						class="p-6 text-center text-body-sm text-neutral-400"
					>
						Chargement...
					</p>

					<p
						v-else-if="error"
						class="p-6 text-center text-body-sm text-red-600"
					>
						Impossible de charger la boîte mail.
					</p>

					<p
						v-else-if="mails.length === 0"
						class="p-6 text-center text-body-sm text-neutral-400"
					>
						Aucun e-mail reçu pour le moment.
					</p>

					<ul v-else class="divide-y divide-neutral-200">
						<li v-for="mail in mails" :key="mail.slug">
							<button
								type="button"
								class="flex w-full cursor-pointer items-center gap-3.5 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-neutral-50"
								@click="openMailSlug = mail.slug"
							>
								<img
									:src="mail.coverImage"
									:alt="mail.title"
									class="h-10 w-10 shrink-0 rounded-full border border-neutral-200 object-cover"
								>

								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p
											class="truncate font-display text-body-lg text-neutral-900"
											:class="mail.started ? 'font-normal' : 'font-semibold'"
										>
											{{ mail.title }}
										</p>
										<span
											v-if="mail.started"
											class="shrink-0 font-mono text-micro tracking-mono text-neutral-400"
										>
											EN COURS
										</span>
									</div>
									<p class="line-clamp-1 text-body-sm text-neutral-500">
										{{ mail.description }}
									</p>
								</div>
							</button>
						</li>
					</ul>
				</div>

				<MailDetail
					v-else
					:mail="openMail"
					@back="openMailSlug = null"
					@accept="handleAccept"
					@resolve="handleResolve"
				/>
			</div>
		</div>
	</Transition>

	<ResolutionModal
		v-if="activeResolutionSlug"
		:slug="activeResolutionSlug"
		@close="activeResolutionSlug = null"
	/>
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
