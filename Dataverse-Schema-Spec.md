# Community Housing Inspection — Schema Spec (Header/Detail)

Derived from `community_housing_inspection_template.docx`. The template has two grains of
data: one **inspection visit** (header) and 41 **checklist line items** (detail). The
original flat design put both grains on `cp_communityhousinginspection`, which only has
room for one line item per record. This spec splits them.

## 1. `cp_communityhousinginspection` (existing table — header only)

Keep these columns as originally specified:

| Column | Type |
|---|---|
| `cp_nameofparticipant` | Lookup → `contact` |
| `cp_caseworker` | Lookup → `cp_staff` |
| `cp_teamlead` | Lookup → `cp_staff` |
| `cp_datecompleted` | Date and Time |
| `cp_streetaddress` | Multiple lines of text |
| `cp_unitnumber` | Single line of text |
| `cp_city` | Single line of text |
| `cp_additionalnotes` | Multiple lines of text |
| `cp_participantsignature` | Multiple lines of text (pen input) |
| `cp_caseworkersignature` | Multiple lines of text (pen input) |

**Remove** these from the parent — they move to the new child table below:
`cp_area`, `cp_item`, `cp_specificinspectionquestions`, `cp_condition`, `cp_phototaken`,
`cp_repairrequestsubmitted`, `cp_notesandexactlocation`.

## 2. New table: `cp_inspectionitem` (one row per checklist line)

| Column | Type | Notes |
|---|---|---|
| `cp_inspection` | Lookup → `cp_communityhousinginspection` | Required. Relationship type: **Parental** (child rows cascade-delete with the header). |
| `cp_linenumber` | Whole Number | 1–41, fixed order matching the template (see `template/inspectionTemplate.ts` in the PCF project — it's the single source of truth both the seeding logic and this numbering use). |
| `cp_area` | Choice | Same 8 values as originally specified (Entry…General). |
| `cp_item` | Choice | Same value set as originally specified, plus `"Walls/Ceiling": 121570006` (added to fill the gap for Bathroom row 7 — see note below). |
| `cp_specificinspectionquestions` | Choice | Same 41 values as originally specified. |
| `cp_condition` | Choice | Same value set (Good/Fair/Poor/Pass/Fail/Yes/No). Only the subset relevant to each row is shown in the PCF (e.g. smoke detectors only offer Pass/Fail). |
| `cp_phototaken` | Yes/No | **Leave unrequired.** The 5 "Additional Common Areas" rows (Laundry, Balcony/Patio ×2, General ×2) have no Photo Taken column in the template — the PCF hides the control for those rows and leaves the value null. |
| `cp_repairrequestsubmitted` | Yes/No | Radio button interface, as originally specified. |
| `cp_notesandexactlocation` | Multiple lines of text | |

### `cp_inspection` lookup — navigation property casing

When creating checklist rows, the PCF sets the parent lookup via `@odata.bind`, which requires
the **navigation property name**, not the lowercase logical name — and Dataverse does not
guarantee they match for custom lookups. In this environment the lookup's logical name is
`cp_inspection` but its actual navigation property (confirmed via
`EntityDefinitions(LogicalName='cp_inspectionitem')/ManyToOneRelationships`) is `cp_Inspection`
(capital I). The PCF's `Parent_Lookup_Navigation_Property` control setting carries this value
separately from the logical name — defaults to `cp_Inspection`, matching this environment. If
the lookup is ever recreated, re-check the actual navigation property name via that same
metadata query rather than assuming it matches the logical name's casing.

### `cp_item` choice set — resolved gap

The original value list had 32 entries but skipped `121570006`, `121570011`, and
`121570021`. Row 7 of the Bathroom section ("Walls/Ceiling") had no matching item value.
`"Walls/Ceiling": 121570006` has since been added to the choice set, and the PCF's
template config (`template/inspectionTemplate.ts` → `ITEM_VALUE.WallsCeiling`, used by the
Bathroom section's row 30) now points at it. The remaining gap at `121570011` and
`121570021` is unused and not load-bearing for this control.

## 3. Relationship

- `cp_inspectionitem.cp_inspection` (N:1) → `cp_communityhousinginspection`
- Cascade: **Parental** (Assign/Share/Reparent/Delete cascade to children) so deleting an
  inspection cleans up its 41 line items.
- Add a subgrid of `cp_inspectionitem` (view: all 41 rows, sorted by `cp_linenumber`) to the
  `cp_communityhousinginspection` main form. The PCF control described below replaces that
  subgrid's default rendering.

## 4. Row → template mapping (for reference/QA)

41 rows total, grouped into 6 color-coded sections. Full row-by-row Area/Item/Question/Condition-type
mapping lives in code at `pcf/InspectionChecklist/InspectionChecklist/template/inspectionTemplate.ts`
— treat that file as authoritative over this table if they ever diverge.

| Section | Area value(s) | Rows | Theme color |
|---|---|---|---|
| Entry / Hallway | Entry | 6 | `#4472C4` |
| Living Room | Living Room | 8 | `#ED7D31` |
| Kitchen / Dining | Kitchen | 9 | `#FFC000` |
| Bathroom | Bathroom | 7 | `#70AD47` |
| Bedroom #1 | Bedroom | 6 | `#5B9BD5` |
| Additional Common Areas | Laundry, Balcony/Patio, General | 5 | `#A5A5A5` (no Photo Taken column) |
