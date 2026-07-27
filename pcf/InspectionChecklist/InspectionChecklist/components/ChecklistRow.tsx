import * as React from "react";
import { Dropdown, Option, RadioGroup, Radio, Textarea, Spinner } from "@fluentui/react-components";
import { ChecklistRowTemplate, CONDITION_OPTIONS } from "../template/inspectionTemplate";
import { RowEditState } from "./types";

export interface ChecklistRowProps {
  template: ChecklistRowTemplate;
  state: RowEditState | undefined;
  showPhotoTaken: boolean;
  isDisabled: boolean;
  onConditionChange: (recordId: string, value: number) => void;
  onPhotoTakenChange: (recordId: string, value: boolean) => void;
  onRepairRequestChange: (recordId: string, value: boolean) => void;
  onNotesBlur: (recordId: string, value: string) => void;
}

const YesNoRadios: React.FC<{
  value: boolean | null;
  disabled: boolean;
  onChange: (value: boolean) => void;
}> = ({ value, disabled, onChange }) => (
  <RadioGroup
    layout="horizontal"
    disabled={disabled}
    value={value === null ? undefined : value ? "yes" : "no"}
    onChange={(_ev, data) => onChange(data.value === "yes")}
  >
    <Radio value="yes" label="Yes" />
    <Radio value="no" label="No" />
  </RadioGroup>
);

export const ChecklistRow: React.FC<ChecklistRowProps> = ({
  template,
  state,
  showPhotoTaken,
  isDisabled,
  onConditionChange,
  onPhotoTakenChange,
  onRepairRequestChange,
  onNotesBlur,
}) => {
  if (!state) {
    return (
      <tr className="cp-row cp-row-pending">
        <td colSpan={showPhotoTaken ? 7 : 6}>
          <Spinner size="tiny" label={`Creating "${template.itemLabel}" row...`} />
        </td>
      </tr>
    );
  }

  const options = CONDITION_OPTIONS[template.conditionType];
  const selectedOption = options.find((o) => o.value === state.condition);
  const [notesDraft, setNotesDraft] = React.useState(state.notes);

  React.useEffect(() => {
    setNotesDraft(state.notes);
  }, [state.notes]);

  return (
    <tr className="cp-row">
      <td className="cp-cell cp-cell-readonly">{template.areaLabel}</td>
      <td className="cp-cell cp-cell-readonly">{template.itemLabel}</td>
      <td className="cp-cell cp-cell-readonly cp-cell-question">{template.questionLabel}</td>
      <td className="cp-cell">
        <Dropdown
          className="cp-dropdown-full"
          style={{ width: "100%", minWidth: 0 }}
          disabled={isDisabled}
          placeholder="Select..."
          value={selectedOption?.label ?? ""}
          selectedOptions={selectedOption ? [String(selectedOption.value)] : []}
          onOptionSelect={(_ev, data) => {
            if (data.optionValue) {
              onConditionChange(state.recordId, Number(data.optionValue));
            }
          }}
        >
          {options.map((o) => (
            <Option key={o.value} value={String(o.value)}>
              {o.label}
            </Option>
          ))}
        </Dropdown>
      </td>
      {showPhotoTaken && (
        <td className="cp-cell">
          <YesNoRadios
            value={state.photoTaken}
            disabled={isDisabled}
            onChange={(v) => onPhotoTakenChange(state.recordId, v)}
          />
        </td>
      )}
      <td className="cp-cell">
        <YesNoRadios
          value={state.repairRequestSubmitted}
          disabled={isDisabled}
          onChange={(v) => onRepairRequestChange(state.recordId, v)}
        />
      </td>
      <td className="cp-cell cp-cell-notes">
        <div className="cp-notes-wrap">
          <Textarea
            className="cp-notes-textarea"
            style={{ width: "100%", minWidth: 0 }}
            disabled={isDisabled}
            resize="vertical"
            value={notesDraft}
            onChange={(_ev, data) => setNotesDraft(data.value)}
            onBlur={() => {
              if (notesDraft !== state.notes) {
                onNotesBlur(state.recordId, notesDraft);
              }
            }}
          />
          {state.saving && <Spinner size="tiny" className="cp-row-status" />}
          {state.error && !state.saving && (
            <span className="cp-row-status cp-row-error" title={state.error}>
              ⚠
            </span>
          )}
        </div>
      </td>
    </tr>
  );
};
