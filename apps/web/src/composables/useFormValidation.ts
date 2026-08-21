import { computed, reactive, ref } from "vue";
import { z } from "zod";

/**
 * Logique de validation partagée par les formulaires : état des champs,
 * parsing Zod, et accès aux messages d'erreur par champ.
 *
 * Les erreurs ne sont exposées qu'après la première tentative d'envoi, puis
 * se corrigent en direct pendant la frappe.
 */
export function useFormValidation<Values extends object, Output>(
	schema: z.ZodType<Output, Values>,
	initialValues: Values,
) {
	const values = reactive({ ...initialValues }) as Values;
	const submitted = ref(false);

	const result = computed(() => schema.safeParse(values));

	const fieldErrors = computed(() =>
		result.value.success
			? null
			: (z.flattenError(result.value.error).fieldErrors as Record<
					string,
					string[] | undefined
				>),
	);

	function errorFor(field: keyof Values & string) {
		if (!submitted.value) return undefined;
		return fieldErrors.value?.[field]?.[0];
	}

	/** Marque le formulaire comme soumis et renvoie les données validées, ou null. */
	function validate() {
		submitted.value = true;

		return result.value.success ? result.value.data : null;
	}

	return { values, submitted, errorFor, validate };
}