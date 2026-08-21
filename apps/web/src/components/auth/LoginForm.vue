<script setup lang="ts">
import BaseField from "@/components/ui/BaseField.vue";
import { useFormValidation } from "@/composables/useFormValidation";
import { loginFormSchema } from "@/schemas/auth.schema";

const { values, errorFor, validate } = useFormValidation(loginFormSchema, {
	email: "",
	password: "",
});

function handleSubmit() {
	const data = validate();

	if (!data) return;

	console.log("login", data);
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

		<button
			type="submit"
			class="mt-1.5 w-full border border-accent bg-accent py-4 font-sans font-semibold text-ui tracking-cta text-accent-contrast transition-colors duration-150 hover:border-accent-hover hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent-hover focus-visible:outline-offset-[3px]"
		>
			SE CONNECTER
		</button>
	</form>
</template>
