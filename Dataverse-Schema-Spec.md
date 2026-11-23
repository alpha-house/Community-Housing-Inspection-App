# Community Housing Inspection — Schema Spec (Header/Detail)

Derived from `community_housing_inspection_template.docx`. The template has two grains of
data: one **inspection visit** (header) and 47 **checklist line items** (detail — originally
41, extended with a second bedroom section, see §5). The original flat design put both
grains on `cp_communityhousinginspection`, which only has room for one line item per record.
This spec splits them.

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
| `cp_linenumber` | Whole Number | 1–47 (not contiguous by section — see §5), fixed values matching the template (see `template/inspectionTemplate.ts` in the PCF project — it's the single source of truth both the seeding logic and this numbering use). |
| `cp_area` | Choice | Same 8 values as originally specified (Entry…General), plus `"Bedroom-2": 121570008` (added for the second bedroom section — see §5). |
| `cp_item` | Choice | Same value set as originally specified, plus `"Walls/Ceiling": 121570006` (added to fill the gap for Bathroom row 7 — see note below). |
| `cp_specificinspectionquestions` | Choice | Same 41 values as originally specified. |
| `cp_condition` | Choice | Same value set (Good/Fair/Poor/Pass/Fail/Yes/No), plus `"N/A": 121570007`. Only the subset relevant to each row's condition type is shown in the PCF (e.g. smoke detectors only offer Pass/Fail), but N/A is appended to every row regardless of type — it's the only way to clear a Condition back to a blank-equivalent state, since the Dropdown control has no "clear selection" gesture of its own. |
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
- Add a subgrid of `cp_inspectionitem` (view: all 47 rows, sorted by `cp_linenumber`) to the
  `cp_communityhousinginspection` main form. The PCF control described below replaces that
  subgrid's default rendering — the PCF's own section order (from `SECTIONS` in
  `inspectionTemplate.ts`) is authoritative for on-screen ordering; the raw subgrid/list view
  sorted by `cp_linenumber` alone will show Bedroom #2 (42–47) after Additional Common Areas
  (37–41) since those numbers were assigned later without renumbering existing rows (see §5).

## 4. Row → template mapping (for reference/QA)

41 original rows plus 6 Bedroom #2 rows (47 total), grouped into 7 color-coded sections.
Full row-by-row Area/Item/Question/Condition-type mapping lives in code at
`pcf/InspectionChecklist/InspectionChecklist/template/inspectionTemplate.ts` — treat that
file as authoritative over this table if they ever diverge.

| Section | Area value(s) | Rows | Line numbers | Theme color |
|---|---|---|---|---|
| Entry / Hallway | Entry | 6 | 1–6 | `#4472C4` |
| Living Room | Living Room | 8 | 7–14 | `#ED7D31` |
| Kitchen / Dining | Kitchen | 9 | 15–23 | `#FFC000` |
| Bathroom | Bathroom | 7 | 24–30 | `#70AD47` |
| Bedroom #1 | Bedroom | 6 | 31–36 | `#5B9BD5` |
| Additional Common Areas | Laundry, Balcony/Patio, General | 5 | 37–41 | `#A5A5A5` (no Photo Taken column) |
| Bedroom #2 | Bedroom-2 | 6 | 42–47 | `#5B9BD5` (same as Bedroom #1) |

## 5. Bedroom #2 section (added after initial build)

Added a second bedroom section identical in structure to Bedroom #1 (Flooring, Walls,
Windows, Closet, Light Fixture, Smoke Detector), styled with the same blue (`#5B9BD5`) since
it's the same room type. Required only one schema change — a new `cp_area` choice option,
`"Bedroom-2": 121570008` — because the item and question choice values are **reused** from
Bedroom #1's rows (e.g. both bedrooms' "Flooring" rows point at the same
`cp_specificinspectionquestions` value, `121570030`, "Carpet stains, burns, odours,
scratches?"). This mirrors how `Flooring`/`Walls`/`Windows`/etc. item values already get
reused across multiple sections elsewhere in the template — the row's `cp_linenumber` is
what actually identifies it, not the item/question value, so sharing those values across
bedrooms is safe and avoids growing the choice sets unnecessarily.

New rows got line numbers 42–47 (continuing after the existing max of 41) rather than
renumbering Additional Common Areas out of the way, specifically to avoid breaking the
`cp_linenumber` matching for line items that already existed in production records before
this change.

## 6. Service request approval (`cp Service Request Approval` flow)

Approval workflow for `cp_communityservicerequest`, modelled on the `Incident Report Approval
Request` flow. The flow definition is exported to
[`flows/cp-service-request-approval.json`](flows/cp-service-request-approval.json); all
components below live in the `CommunityHousingInspection` solution.

### Schema additions

| Component | Name | Notes |
|---|---|---|
| Choice column on `cp_communityservicerequest` | `cp_srapprovalstatus` (SR Approval Status) | Uses the global `cp_irapprovalstatus` choice: `121570000` Pending Approval, `121570001` Needs Review, `121570002` Approved, `121570003` Rejected |
| Environment variable (Text) | `cp_CSREnvironmentUrlandAppID` | Record-link prefix for the approval. Default points at the sandbox Community Housing Inspection app — **set the production value on deploy** |

### Flow behaviour

- **Trigger:** `cp_communityservicerequest` modified, filtered on `cp_requestapproval`.
- **Gate:** continue only if the row is new (`createdon = modifiedon`) or
  `cp_requestapproval = true` — identical to the incident report flow.
- **Recipients:** every `cp_servicerequestapprover` row (no service matching — the flow is
  service independent). Each `cp_approver` (→ `cp_staff`) is resolved to `cp_email` and the
  emails are joined with `;`.
- **Approval:** custom responses Needs Review / Approved / Rejected. Details show
  `cp_submitterscomments`; the item link is `cp_CSREnvironmentUrlandAppID` + record id.
- **Outcome:** writes `cp_approverscomments`, sets `cp_srapprovalstatus`, resets
  `cp_requestapproval = false`. Needs Review also emails the comments to the record creator.
  Unlike the incident report flow, Approved does **not** deactivate the record.
- **Approved By:** for any outcome, the responder's email is matched to `cp_staff.cp_email`
  and the matching staff row is written to the `cp_approvedby` lookup. If no staff row
  matches, `cp_approvedby` is left unchanged.

## 7. Primary name (`Community Service Request - Set Name` flow)

Sets `cp_communityservicerequestname` to
`<cp_participant.fullname> - <cp_participantaddress> - <createdon>`. Definition exported to
[`flows/community-service-request-set-name.json`](flows/community-service-request-set-name.json).

- **Trigger:** `cp_communityservicerequest` added, or modified on `cp_participant` /
  `cp_participantaddress`. Writing the name doesn't touch either column, so there is no loop.
- **Participant:** contact `fullname`; left blank if no participant is set.
- **Address:** line breaks replaced with `, ` so the name stays on one line.
- **createdon:** converted from UTC to Mountain time, formatted `yyyy-MM-dd h:mm tt`.
- **Length:** truncated to 850 characters (column max).
- The older `Set Name - Community Service Request` flow also writes this column on modify
  (without createdon) and should be turned off to avoid the two flows overwriting each other.

## 8. `cp_communityhousing` (Community Housing — one row per client tenancy)

Built from `docs/community_housing_clients.xlsx`. Columns that already exist on `contact`
(HMIS ID → `cp_hmisfilenumber`, Client First/Last Name → `firstname`/`lastname`) are not
duplicated. Building address and unit # live here, not on contact, because one client can
have several tenancies (the sheet has "Rehouse" rows). The sheet's Email Address / Phone
Number / Payment Address columns are the landlord's, so they are stored as landlord columns.

| Sheet column | Column | Type |
|---|---|---|
| — | `cp_name` (Name, primary) | Single line of text, optional |
| (client) | `cp_client` | Lookup → `contact`. Relationship `cp_contact_cp_communityhousing_Client` (1:N, delete = Remove Link) |
| Pod | `cp_pod` | Choice, global `cp_pod`: Core `121570000`, HL `121570001`, NE `121570002`, NW `121570003`, SE `121570004`, SW `121570005` |
| Team Lead | `cp_teamlead` | Lookup → `cp_staff`. Relationship `cp_cp_staff_cp_communityhousing_TeamLead` |
| Client Unit # | `cp_unitnumber` | Single line of text (50) |
| Client Building Address | `cp_buildingaddress` | Single line of text (250) |
| Move-in Date | `cp_moveindate` | Date only |
| Move-in Date (non-date values) | `cp_moveindateother` | Single line of text (100) — e.g. "Rehouse", "TBD" |
| Lease Expiry | `cp_leaseexpiry` | Date only |
| Lease Expiry (non-date values) | `cp_leaseexpiryother` | Single line of text (100) — e.g. "Month to Month" |
| Rent Amount | `cp_rentamount` | Currency |
| Client Amount | `cp_clientamount` | Currency |
| Alpha Subsidy | `cp_alphasubsidy` | Currency |
| Landlord | `cp_landlord` | Single line of text (200) |
| Main Contact | `cp_maincontact` | Single line of text (100) |
| Email Address | `cp_landlordemail` | Single line of text, Email format |
| Phone Number | `cp_landlordphone` | Single line of text, Phone format |
| Payment Address | `cp_paymentaddress` | Single line of text (250) |
| EFT/Cheque | `cp_paymentmethod` | Choice, global `cp_paymentmethod`: EFT `121570000`, Cheque `121570001` |

**Forms:** main form "Community Housing" (sections Client, Unit, Rent, Landlord) and
"Community Housing Quick Create" (quick create is enabled on the table, so the contact's
related Community Housing grid can add rows inline).

**Views:** Active, Inactive, My, Advanced Find, Associated (shown on the contact's related
tab), Lookup, and Quick Find. The table, both forms and all views are in the Community
Housing Inspection app, with a sitemap entry after Contacts.

**Quick Find search columns:** this org rejects `fetchxml` updates to the Quick Find view via
the Web API (`0x80040216`), so only its grid columns were set programmatically. Its find
columns are still just `cp_name` — add Building Address, Unit #, Landlord and Main Contact in
the maker portal (table → Views → Quick Find → Find by).

## 9. Primary name (`Community Housing - Set Name` flow)

Sets `cp_communityhousing.cp_name` to `<cp_client.fullname> <cp_buildingaddress>`.
Unique name `cp_CommunityHousingSetName`; definition exported to
[`flows/community-housing-set-name.json`](flows/community-housing-set-name.json).

- **Trigger:** `cp_communityhousing` added, or modified on `cp_client` / `cp_buildingaddress`.
  Writing the name doesn't touch either column, so there is no loop.
- **Client:** contact `fullname`; left blank if no client is set.
- **Format:** the two parts joined with a single space and trimmed, so a missing client or
  address leaves no stray space.
- **Length:** truncated to 200 characters (column max).

## 10. Spreadsheet import (`Update Community Housing and Client Records` flow)

Instant (manual) flow that loads `community_housing_clients.xlsx` into Dataverse. Unique name
`cp_UpdateCommunityHousingandClientRecords`; definition exported to
[`flows/update-community-housing-and-client-records.json`](flows/update-community-housing-and-client-records.json).

- **Source:** SharePoint site `AHCDocuments`, library *Community Housing Inspection*, file
  `community_housing_clients.xlsx` (drive/file ids are fixed in the flow). Uses the Excel
  connection reference `cp_sharedexcelonlinebusiness_chi01` and Dataverse reference
  `ahb_sharedcommondataserviceforapps_c4d89`.
- **Excel table:** the connector only reads named tables. If `CommunityHousingClients` is
  missing, the flow creates it over `A1:R1000` of the first worksheet. Blank rows are filtered
  out. The table name is passed through a variable so the flow can be saved before the table exists.
- **Row limit input:** processes only the first N rows (0/blank = all) — for testing.
- **Client:** matched on `contact.cp_hmisfilenumber` = HMIS ID (non-breaking spaces stripped). If
  none, a contact is created with first/last name, HMIS ID and `cp_dateofbirthunknown = true`
  (the sheet has no DOB; `cp_dateofbirth` is business-required, so the flow passes it as null).
  Rows without an HMIS ID ("Alpha House" placeholder units) get a housing record with no client.
- **Housing record:** updated if one exists for the same client + building address (placeholder
  rows: no client + same address + unit), otherwise created. Re-running does not duplicate.
- **Dates:** ISO dates, Excel serial numbers, and text like "July 1st 2025" / "Dec 1st 2024" /
  "05/31/2025" (ordinal suffixes stripped, common month typos fixed) go to the date column;
  anything unparseable or with a year outside 2000–2040 goes to the "Other" text column.
- **Amounts:** the leading number of the cell (`$`, `,` and trailing notes dropped).
- **Pod / EFT-Cheque:** mapped to `cp_pod` / `cp_paymentmethod` option values (case-insensitive).
- **Team Lead:** set only when exactly one active `cp_staff` name starts with the sheet value.
- **Landlord email:** only stored if it contains `@`.
- **Run time:** ~5 minutes for the full sheet (rows processed sequentially).
- **Summary:** the `Compose_summary` action reports rows processed, clients created and housing
  records created/updated.
