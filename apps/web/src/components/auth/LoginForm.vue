<script setup lang="ts">
import { useMutation } from "@pinia/colada";
import type {
	AuthResponse,
	LoginParams,
} from "@repo/shared/schemas/auth.schema";
import { computed } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseField from "@/components/ui/BaseField.vue";
import { useFormValidation } from "@/composables/useFormValidation";
import { ApiError, api } from "@/lib/http";
import { loginFormSchema } from "@/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";

const auth = useAuthStore();
const router = useRouter();

const { values, errorFor, validate } = useFormValidation(loginFormSchema, {
	email: "",
	password: "",
});

const { mutate, isLoading, error } = useMutation({
	mutation: (params: LoginParams) =>
		api<AuthResponse>("/auth/login", { method: "POST", body: params }),
	onSuccess: (session) => {
		auth.setSession(session);
		router.push({ name: "hub" });
	},
});

/**
 * On reste volontairement vague : distinguer "email inconnu" de "mot de passe
 * faux" permettrait d'énumérer les comptes existants. Un 400 de validation est
 * traité pareil, pour ne pas dévoiler nos règles de complexité.
 */
const errorMessage = computed(() => {
	if (!error.value) return null;

	if (error.value instanceof ApiError) {
		return "Email ou mot de passe incorrect";
	}

	return "Connexion au serveur impossible";
});

function handleSubmit() {
	const data = validate();

	if (!data) return;

	mutate(data);
}
</script>

<template>
	<form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
		<BaseField
			v-model="values.email"
			:error="errorFor('email')"
			label="EMAIL"
			type="email"
			autocomplete="email"
			placeholder="detective@exemple.fr"
		/>

		<BaseField
			v-model="values.password"
			:error="errorFor('password')"
			label="MOT DE PASSE"
			type="password"
			autocomplete="current-password"
			placeholder="••••••••"
		/>

		<p
			v-if="errorMessage"
			class="border border-danger bg-danger-surface px-3.75 py-3 font-mono text-[11px] leading-relaxed text-danger"
		>
			&gt; {{ errorMessage }}
		</p>

		<BaseButton :loading="isLoading"> SE CONNECTER </BaseButton>
	</form>
</template>
