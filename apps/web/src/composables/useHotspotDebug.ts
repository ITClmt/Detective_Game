import { onMounted, onUnmounted, ref } from "vue";

function isTypingTarget(target: EventTarget | null) {
	return (
		target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
	);
}

/**
 * Touche D : bascule l'overlay de placement des hotspots (hub ou scène).
 * Inerte en prod (`import.meta.env.DEV` résolu au build par Vite) — un
 * joueur sur le site déployé ne doit jamais pouvoir l'ouvrir.
 */
export function useHotspotDebug() {
	const debugMode = ref(false);

	if (!import.meta.env.DEV) return { debugMode };

	function handleKeydown(event: KeyboardEvent) {
		if (event.key.toLowerCase() === "d" && !isTypingTarget(event.target)) {
			debugMode.value = !debugMode.value;
		}
	}

	onMounted(() => window.addEventListener("keydown", handleKeydown));
	onUnmounted(() => window.removeEventListener("keydown", handleKeydown));

	return { debugMode };
}
