/**
 * Fenêtre fixe : un compteur qui expire à `resetAt`, puis repart de zéro.
 * `resetAt` est un instant (ms depuis l'epoch), pas une durée.
 */
type Bucket = { count: number; resetAt: number };

/**
 * Le middleware ne parle qu'à ce contrat : passer à Redis un jour se réduira à
 * écrire une seconde implémentation, sans y toucher.
 *
 * `hit` est asynchrone alors que la version mémoire n'en a aucun besoin. C'est
 * volontaire : Redis répond par le réseau, et sans cet `await` dès maintenant
 * toute la chaîne d'appel devrait changer le jour de la bascule.
 */
export type RateLimitStore = {
	hit: (key: string, windowMs: number) => Promise<Bucket>;
};

/**
 * Portée module : cette Map survit aux requêtes, c'est ce qui rend le comptage
 * possible. Elle repart vide à chaque redémarrage du process.
 */
const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

/**
 * Une fenêtre périmée ne disparaît pas toute seule : une IP vue une seule fois
 * laisse son entrée pour toujours. Sans ce balayage, un attaquant qui change
 * d'adresse à chaque requête transforme la protection anti-DoS en fuite de
 * mémoire. On balaie au plus une fois par minute — parcourir toute la Map à
 * chaque requête coûterait plus cher que le service rendu.
 */
const sweep = (now: number) => {
	if (now - lastSweep < SWEEP_INTERVAL_MS) return;

	lastSweep = now;

	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}
};

export const memoryRateLimitStore: RateLimitStore = {
	hit: async (key, windowMs) => {
		const now = Date.now();

		sweep(now);

		const current = buckets.get(key);

		// Aucune fenêtre, ou fenêtre expirée : les deux cas repartent de zéro.
		if (!current || current.resetAt <= now) {
			const fresh: Bucket = { count: 1, resetAt: now + windowMs };
			buckets.set(key, fresh);

			return fresh;
		}

		// `current` pointe sur l'objet que la Map contient, pas sur une copie :
		// le muter suffit, il n'y a rien à ranger avec un set().
		// `resetAt` n'est jamais repoussé, c'est ce qui rend la fenêtre fixe.
		current.count += 1;

		return current;
	},
};
