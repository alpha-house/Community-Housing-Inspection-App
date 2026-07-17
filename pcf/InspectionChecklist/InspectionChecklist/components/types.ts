import { IInputs } from "../generated/ManifestTypes";

export interface FieldNames {
  child: string;
  parentLookup: string;
  parentLookupNavigationProperty: string;
  lineNumber: string;
  area: string;
  item: string;
  question: string;
  condition: string;
  photoTaken: string;
  repairRequest: string;
  notes: string;
}

export function readFieldNames(context: ComponentFramework.Context<IInputs>): FieldNames {
  return {
    child: context.parameters.childEntityLogicalName.raw ?? "cp_inspectionitem",
    parentLookup: context.parameters.parentLookupFieldLogicalName.raw ?? "cp_inspection",
    parentLookupNavigationProperty: context.parameters.parentLookupNavigationPropertyName.raw ?? "cp_Inspection",
    lineNumber: context.parameters.lineNumberFieldLogicalName.raw ?? "cp_linenumber",
    area: context.parameters.areaFieldLogicalName.raw ?? "cp_area",
    item: context.parameters.itemFieldLogicalName.raw ?? "cp_item",
    question: context.parameters.questionFieldLogicalName.raw ?? "cp_specificinspectionquestions",
    condition: context.parameters.conditionFieldLogicalName.raw ?? "cp_condition",
    photoTaken: context.parameters.photoTakenFieldLogicalName.raw ?? "cp_phototaken",
    repairRequest: context.parameters.repairRequestFieldLogicalName.raw ?? "cp_repairrequestsubmitted",
    notes: context.parameters.notesFieldLogicalName.raw ?? "cp_notesandexactlocation",
  };
}

export interface RowEditState {
  recordId: string;
  condition: number | null;
  photoTaken: boolean | null;
  repairRequestSubmitted: boolean | null;
  notes: string;
  saving: boolean;
  error: string | null;
}

/** context.mode.contextInfo isn't in the current @types/powerapps-component-framework typings
 *  but is available at runtime for controls placed on a sub-grid of a bound form. */
export interface ModeWithContextInfo extends ComponentFramework.Mode {
  contextInfo?: {
    entityTypeName: string;
    entityId: string;
  };
}
