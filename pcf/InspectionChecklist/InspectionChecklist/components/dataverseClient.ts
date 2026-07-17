import { IInputs } from "../generated/ManifestTypes";
import { ALL_ROWS } from "../template/inspectionTemplate";
import { FieldNames } from "./types";

const entitySetNameCache = new Map<string, string>();

export async function getEntitySetName(
  context: ComponentFramework.Context<IInputs>,
  entityLogicalName: string
): Promise<string> {
  const cached = entitySetNameCache.get(entityLogicalName);
  if (cached) {
    return cached;
  }
  let metadata: unknown;
  try {
    metadata = await context.utils.getEntityMetadata(entityLogicalName);
  } catch (err) {
    throw new Error(
      `Could not look up entity metadata for "${entityLogicalName}": ${(err as Error).message ?? err}`
    );
  }
  const setName = (metadata as { EntitySetName?: string }).EntitySetName;
  if (!setName) {
    throw new Error(
      `getEntityMetadata("${entityLogicalName}") did not return an EntitySetName. Got: ${JSON.stringify(metadata)}`
    );
  }
  entitySetNameCache.set(entityLogicalName, setName);
  return setName;
}

export interface SeedResult {
  created: number;
  errors: string[];
}

/**
 * Creates any of the 41 template rows that don't already exist for this inspection,
 * matched by line number. Runs in small concurrent batches to avoid throttling.
 */
export async function seedMissingRows(
  context: ComponentFramework.Context<IInputs>,
  fields: FieldNames,
  parentEntityTypeName: string,
  parentRecordId: string,
  existingLineNumbers: Set<number>
): Promise<SeedResult> {
  const entitySetName = await getEntitySetName(context, parentEntityTypeName);
  const missing = ALL_ROWS.filter((row) => !existingLineNumbers.has(row.lineNumber));

  const errors: string[] = [];
  let created = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((row) =>
        context.webAPI.createRecord(fields.child, {
          [fields.lineNumber]: row.lineNumber,
          [fields.area]: row.areaValue,
          [fields.item]: row.itemValue,
          [fields.question]: row.questionValue,
          [`${fields.parentLookupNavigationProperty}@odata.bind`]: `/${entitySetName}(${parentRecordId})`,
        })
      )
    );
    results.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        created++;
      } else {
        const reason = result.reason as { message?: string } | undefined;
        const row = batch[idx];
        errors.push(`Line ${row.lineNumber} ("${row.itemLabel}"): ${reason?.message ?? String(result.reason)}`);
      }
    });
  }

  return { created, errors };
}

export async function saveField(
  context: ComponentFramework.Context<IInputs>,
  childEntityLogicalName: string,
  recordId: string,
  fieldLogicalName: string,
  value: number | boolean | string | null
): Promise<void> {
  await context.webAPI.updateRecord(childEntityLogicalName, recordId, {
    [fieldLogicalName]: value,
  });
}
