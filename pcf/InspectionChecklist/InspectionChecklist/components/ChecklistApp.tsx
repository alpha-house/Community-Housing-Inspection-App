import * as React from "react";
import { MessageBar, MessageBarBody, MessageBarTitle, Spinner } from "@fluentui/react-components";
import { IInputs } from "../generated/ManifestTypes";
import { ALL_ROWS, SECTIONS } from "../template/inspectionTemplate";
import { ChecklistRow } from "./ChecklistRow";
import { FieldNames, ModeWithContextInfo, RowEditState } from "./types";
import { saveField, seedMissingRows } from "./dataverseClient";

export interface ChecklistAppProps {
  context: ComponentFramework.Context<IInputs>;
  fields: FieldNames;
}

type Phase = "loading" | "no-parent" | "seeding" | "ready";

export const ChecklistApp: React.FC<ChecklistAppProps> = ({ context, fields }) => {
  const dataset = context.parameters.inspectionItems;
  const isDisabled = context.mode.isControlDisabled;

  const contextInfo = (context.mode as ModeWithContextInfo).contextInfo;
  const parentEntityTypeName = contextInfo?.entityTypeName ?? dataset.getTargetEntityType();
  const parentRecordId = contextInfo?.entityId;

  const columnsRequestedRef = React.useRef(false);
  const seedAttemptedRef = React.useRef(false);
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [seedErrors, setSeedErrors] = React.useState<string[]>([]);
  const [rowsByRecordId, setRowsByRecordId] = React.useState<Record<string, RowEditState>>({});

  // Make sure the fields we need are pulled into the dataset query, even if the
  // subgrid's default view doesn't already include them.
  React.useEffect(() => {
    if (columnsRequestedRef.current || !dataset || dataset.loading) {
      return;
    }
    const existing = new Set(
      dataset.columns.map((c: ComponentFramework.PropertyHelper.DataSetApi.Column) => c.name)
    );
    const needed = [
      fields.lineNumber,
      fields.area,
      fields.item,
      fields.question,
      fields.condition,
      fields.photoTaken,
      fields.repairRequest,
      fields.notes,
    ];
    const missing = needed.filter((n) => !existing.has(n));
    columnsRequestedRef.current = true;
    if (missing.length > 0 && dataset.addColumn) {
      missing.forEach((n) => dataset.addColumn!(n));
      dataset.refresh();
    }
  }, [dataset, fields]);

  // Map current dataset records by their template line number.
  const recordsByLineNumber = React.useMemo(() => {
    const map = new Map<number, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>();
    if (!dataset || dataset.loading) {
      return map;
    }
    for (const id of dataset.sortedRecordIds) {
      const record = dataset.records[id];
      const lineNumber = record.getValue(fields.lineNumber);
      if (typeof lineNumber === "number") {
        map.set(lineNumber, record);
      }
    }
    return map;
  }, [dataset, dataset?.sortedRecordIds, fields.lineNumber]);

  // Seed any of the 41 template rows that don't exist yet for this inspection. Runs
  // whenever some are missing, not just when the dataset is completely empty, so a
  // partial failure (e.g. one row errored, or the checklist was interrupted) gets
  // backfilled next time the form loads instead of leaving a permanent gap.
  React.useEffect(() => {
    if (!dataset || dataset.loading || !columnsRequestedRef.current) {
      return;
    }
    if (!parentRecordId) {
      setPhase("no-parent");
      return;
    }
    if (recordsByLineNumber.size >= ALL_ROWS.length) {
      setPhase("ready");
      return;
    }
    if (seedAttemptedRef.current) {
      setPhase("ready");
      return;
    }
    seedAttemptedRef.current = true;
    setPhase("seeding");

    const existingLineNumbers = new Set(recordsByLineNumber.keys());
    const runSeed = async (): Promise<void> => {
      try {
        const result = await seedMissingRows(context, fields, parentEntityTypeName, parentRecordId, existingLineNumbers);
        if (result.errors.length > 0) {
          setSeedErrors(result.errors);
        }
        dataset.refresh();
      } catch (err) {
        setSeedErrors([(err as Error).message]);
      } finally {
        setPhase("ready");
      }
    };
    void runSeed();
  }, [dataset, recordsByLineNumber, parentRecordId, context, fields, parentEntityTypeName]);

  // Bring newly-seen records into local edit state without clobbering in-flight edits.
  React.useEffect(() => {
    setRowsByRecordId((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const record of recordsByLineNumber.values()) {
        const id = record.getRecordId();
        if (!next[id]) {
          changed = true;
          next[id] = {
            recordId: id,
            condition: (record.getValue(fields.condition) as number) ?? null,
            photoTaken: (record.getValue(fields.photoTaken) as boolean) ?? null,
            repairRequestSubmitted: (record.getValue(fields.repairRequest) as boolean) ?? null,
            notes: (record.getValue(fields.notes) as string) ?? "",
            saving: false,
            error: null,
          };
        }
      }
      return changed ? next : prev;
    });
  }, [recordsByLineNumber, fields]);

  const updateRow = React.useCallback(
    (recordId: string, patch: Partial<RowEditState>) => {
      setRowsByRecordId((prev) => ({
        ...prev,
        [recordId]: { ...prev[recordId], ...patch },
      }));
    },
    []
  );

  const persist = React.useCallback(
    (recordId: string, fieldLogicalName: string, value: number | boolean | string | null, patch: Partial<RowEditState>) => {
      updateRow(recordId, { ...patch, saving: true, error: null });
      saveField(context, fields.child, recordId, fieldLogicalName, value)
        .then(() => updateRow(recordId, { saving: false }))
        .catch((err: Error) => updateRow(recordId, { saving: false, error: err.message }));
    },
    [context, fields.child, updateRow]
  );

  const onConditionChange = React.useCallback(
    (recordId: string, value: number) => persist(recordId, fields.condition, value, { condition: value }),
    [persist, fields.condition]
  );
  const onPhotoTakenChange = React.useCallback(
    (recordId: string, value: boolean) => persist(recordId, fields.photoTaken, value, { photoTaken: value }),
    [persist, fields.photoTaken]
  );
  const onRepairRequestChange = React.useCallback(
    (recordId: string, value: boolean) =>
      persist(recordId, fields.repairRequest, value, { repairRequestSubmitted: value }),
    [persist, fields.repairRequest]
  );
  const onNotesBlur = React.useCallback(
    (recordId: string, value: string) => persist(recordId, fields.notes, value, { notes: value }),
    [persist, fields.notes]
  );

  if (phase === "no-parent") {
    return (
      <MessageBar intent="info">
        <MessageBarBody>
          <MessageBarTitle>Save the inspection first</MessageBarTitle>
          Save this Community Housing Inspection record, then reopen it to fill out the checklist.
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (phase === "loading" || dataset.loading) {
    return <Spinner label="Loading checklist..." />;
  }

  return (
    <div className="cp-checklist-root">
      {phase === "seeding" && <Spinner label="Setting up the 41-item checklist for this inspection..." />}
      {seedErrors.length > 0 && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Checklist setup failed</MessageBarTitle>
            {seedErrors.map((msg, i) => (
              <div key={i}>{msg}</div>
            ))}
          </MessageBarBody>
        </MessageBar>
      )}
      {SECTIONS.map((section) => {
        const showPhotoTaken = section.rows.some((r) => r.hasPhotoTaken);
        return (
          <div
            key={section.key}
            className="cp-section"
            style={{ ["--cp-section-color" as string]: section.color, ["--cp-section-light" as string]: section.lightColor }}
          >
            <div className="cp-section-title">{section.title.toUpperCase()}</div>
            <table className="cp-table">
              <colgroup>
                <col style={{ width: "8%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "30%" }} />
                <col style={{ width: "10%" }} />
                {showPhotoTaken && <col style={{ width: "9%" }} />}
                <col style={{ width: "12%" }} />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Item</th>
                  <th>Specific Inspection Questions</th>
                  <th>Condition</th>
                  {showPhotoTaken && <th>Photo Taken?</th>}
                  <th>Repair Request Submitted?</th>
                  <th>Notes / Exact Location</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row) => {
                  const record = recordsByLineNumber.get(row.lineNumber);
                  const state = record ? rowsByRecordId[record.getRecordId()] : undefined;
                  return (
                    <ChecklistRow
                      key={row.lineNumber}
                      template={row}
                      state={state}
                      showPhotoTaken={showPhotoTaken}
                      isDisabled={isDisabled}
                      onConditionChange={onConditionChange}
                      onPhotoTakenChange={onPhotoTakenChange}
                      onRepairRequestChange={onRepairRequestChange}
                      onNotesBlur={onNotesBlur}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};
