import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { casesTable } from "../../db/schema/index";

const casesRepository = {
	findBySlug: async (slug: string) => {
		const [caseRow] = await db
			.select()
			.from(casesTable)
			.where(and(eq(casesTable.slug, slug), eq(casesTable.is_published, true)))
			.limit(1);

		return caseRow;
	},
};

export default casesRepository;
