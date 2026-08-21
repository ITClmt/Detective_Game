<script setup lang="ts">
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseField from "@/components/ui/BaseField.vue";
import { useAuthStore } from "@/stores/auth.store";
import { useFormValidation } from "@/composables/useFormValidation";
import { registerFormSchema } from "@/schemas/auth.schema";
import type {
	AuthResponse,
	RegisterParams,
} from "@repo/shared/schemas/auth.schema";
import { api, ApiError } from "@/lib/http";
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useMutation } from "@pinia/colada";

const auth = useAuthStore();
const router = useRouter();

const { values, errorFor, validate } = useFormValidation(registerFormSchema, {
	username: "",
	email: "",
	password: "",
	confirmPassword: "",
});

const { mutate, isLoading, error } = useMutation({
	mutation: (params: RegisterParams) =>
		api<AuthResponse>("/auth/register", { method: "POST", body: params }),
	onSuccess: (session) => {
		auth.setSession(session);
		router.push({ name: "home" });
	},
});

const errorMessage = computed(() => {
	if (!error.value) return null;

	if (error.value instanceof ApiError) {
		return "Erreur lors de l'inscription. Veuillez réessayer.";
	}

	return "Connexion au serveur impossible";
});

function handleSubmit() {
	const data = validate();

	if (!data) return;

	mutate({
		username: data.username,
		email: data.email,
		password: data.password,
	});
}
</script>

<template>
	<form class="flex flex-col gap-3" @submit.prevent="handleSubmit">
		<BaseField
			v-model="values.username"
			:error="errorFor('username')"
			label="NOM D'UTILISATEUR"
			autocomplete="username"
			placeholder="Enzo Triviani"
			hint="3 à 32 caractères"
		/>

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
			autocomplete="new-password"
			placeholder="••••••••"
			hint="6 à 32 caractères - une majuscule, une minuscule, un chiffre, un caractère spécial (@ $ ! % * ? &)"
		/>

		<BaseField
			v-model="values.confirmPassword"
			:error="errorFor('confirmPassword')"
			label="CONFIRMER LE MOT DE PASSE"
			type="password"
			autocomplete="new-password"
			placeholder="••••••••"
		/>

		<p
			v-if="errorMessage"
			class="border border-danger bg-danger-surface px-3.75 py-3 font-mono text-[11px] leading-relaxed text-danger"
		>
			&gt; {{ errorMessage }}
		</p>

		<BaseButton :loading="isLoading"> CRÉER MON COMPTE </BaseButton>
	</form>
</template>
