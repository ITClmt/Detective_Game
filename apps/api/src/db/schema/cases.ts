import {
  type AnyPgColumn,
  boolean,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { CaseFile } from "@repo/shared/schemas/case.schema";

/**
 * Une ligne = une enquête. `content` stocke le `CaseFile` complet validé par
 * `parseCaseFile()` (schemaVersion/case/content/solution, voir
 * `@repo/shared`) — c'est la source de vérité du contenu narratif.
 *
 * `slug`/`title`/`sort_order`/`is_published` existent aussi dans ce jsonb
 * (`case.slug`, `case.title`, `case.order`, `case.isPublished`) : les
 * dupliquer en colonnes SQL sert uniquement à pouvoir requêter (lookup par
 * slug, tri, filtre "publiées") sans aller fouiller dans le JSON. Au
 * seed/insert, ces colonnes sont dérivées du jsonb, jamais l'inverse.
 */
export const casesTable = pgTable("cases", {
  id: uuid().primaryKey().defaultRandom(),
  slug: varchar().notNull().unique(),
  title: varchar().notNull(),
  sort_order: integer().notNull(),
  is_published: boolean().notNull().default(false),
  /**
   * Enquête à avoir résolue avant que celle-ci ne devienne accessible ;
   * `null` pour les enquêtes disponibles d'emblée. Auto-référence vers cette
   * même table : une vraie FK garantit qu'on ne peut pas pointer vers une
   * enquête inexistante, ce que `case.schema.ts` ne peut pas vérifier
   * structurellement (voir son commentaire "CE QUE CE SCHÉMA NE PEUT PAS
   * VÉRIFIER"). `AnyPgColumn` casse le cycle de types que Drizzle ne peut
   * pas résoudre tout seul sur une auto-référence.
   */
  unlock_requirement: uuid().references((): AnyPgColumn => casesTable.id),
  content: jsonb().$type<CaseFile>().notNull(),
  updated_at: timestamp(),
  created_at: timestamp().defaultNow().notNull(),
});
