import { fileURLToPath } from "node:url";
import { parseCaseFile } from "@repo/shared/schemas/case.schema";
import { eq } from "drizzle-orm";
import { db, pool } from "./client";
import { casesTable } from "./schema/index";

const contentPath = fileURLToPath(
	new URL("../../../../content/verdier.json", import.meta.url),
);

const raw = await Bun.file(contentPath).json();
const caseFile = parseCaseFile(raw);

const unlockRequirementSlug = caseFile.case.unlockRequirement;
let unlockRequirementId: string | null = null;

if (unlockRequirementSlug) {
	const [requirement] = await db
		.select({ id: casesTable.id })
		.from(casesTable)
		.where(eq(casesTable.slug, unlockRequirementSlug))
		.limit(1);

	if (!requirement) {
		throw new Error(
			`Enquête prérequise introuvable : ${unlockRequirementSlug}`,
		);
	}

	unlockRequirementId = requirement.id;
}

try {
	await db
		.insert(casesTable)
		.values({
			slug: caseFile.case.slug,
			title: caseFile.case.title,
			sort_order: caseFile.case.order,
			is_published: caseFile.case.isPublished,
			unlock_requirement: unlockRequirementId,
			content: caseFile,
		})
		.onConflictDoUpdate({
			target: casesTable.slug,
			set: {
				title: caseFile.case.title,
				sort_order: caseFile.case.order,
				is_published: caseFile.case.isPublished,
				unlock_requirement: unlockRequirementId,
				content: caseFile,
				updated_at: new Date(),
			},
		});

	console.log(`Enquête "${caseFile.case.slug}" insérée/mise à jour.`);
} finally {
	await pool.end();
}
