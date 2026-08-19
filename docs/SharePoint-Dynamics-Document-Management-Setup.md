---
title: SharePoint Document Management Integration — Community Housing Inspection
tags:
  - dynamics365
  - sharepoint
  - power-automate
  - alpha-house
  - document-management
date-started: 2026-07-27
date-resolved: 2026-07-31
status: resolved
---

# SharePoint Document Management Integration — Community Housing Inspection

## Overview

This document records the troubleshooting and resolution of SharePoint document upload routing for the `cp_communityhousinginspection` custom entity in the Alpha House Calgary Dynamics 365 model-driven app (Sandbox environment).

**Environment details:**
- Dynamics 365 org: `orgebf6398d.crm3.dynamics.com` (Sandbox)
- SharePoint tenant: `alphahousecalgaryca.sharepoint.com`
- Site (current): `/sites/AlphaHouseSandbox` *(previously `/sites/ClientDocuments`, migrated mid-troubleshooting)*
- Target library internal name: `cp_communityhousinginspection` (display name: "Community Housing Inspection")
- Related/reference entity: `cp_inspectionitem` (used as a working example)

---

## 1. The Problem

Files uploaded from `cp_communityhousinginspection` records were not going to the intended `Community Housing Inspection` SharePoint library. Instead, uploads routed into a nested path under the related **Contact** record's own folder structure:

```
/sites/ClientDocuments/contact/{ContactName}_{GUID}/cp_communityhousinginspection/{RecordName}_{GUID}
```

### Key symptoms
- **Path mismatch**: Dynamics resolved contact-related documents to a shallower path (`/contact/`) than where folders actually lived (`/contact/Client/`)
- **Broken Document Location records**: opening the Documents tab threw:
  > "Folder '{name}' has been renamed or deleted from SharePoint. It was expected inside '{path}'. Restore the folder on SharePoint and try again."
- **Orphaned duplicate records**: Running the Dynamics **Document Management Settings wizard** multiple times (without cleanup) created multiple duplicate `SharePoint Document Location` records with blank `Regarding` fields, all sharing `Relative URL: cp_communityhousinginspection` but pointing at different parents.

### Root cause identified
`cp_communityhousinginspection` has a lookup relationship to `Contact`. Contact was already enabled for document management with its own Document Location. Whenever Dynamics found **no explicit Document Location already attached to a specific record**, it fell back to auto-creating one **nested inside the related Contact's own folder**, named after the entity's schema name. This fallback behavior:
- Persisted even after deleting all `SharePoint Document Location` records
- Persisted even after unchecking "Based on entity" in the wizard's Folder Structure step
- Was ultimately traced to the **`Default Site`** SharePoint Site record in Dataverse, which had `folderstructureentity` set to `contact` — a **site-level** fallback setting independent of the wizard's per-entity checkbox.

---

## 2. Remediation Attempts (Chronological)

### 2.1 Wizard reconfiguration
- Attempted running `Settings > Document Management > Document management settings` and unchecking "Based on entity" at the Folder Structure step.
- **Result:** Did not resolve the issue — nesting persisted.

### 2.2 Manual Document Location cleanup
- Identified and deleted duplicate/orphaned `SharePoint Document Location` records (blank `Regarding`, `Relative URL: cp_communityhousinginspection`, various parents).
- Deleted the broken record tied to the affected Contact record.
- **Result:** New broken records reappeared on next upload due to the site-level fallback (see 1, Root cause).

### 2.3 Manual "New Document Location" record creation
- Attempted creating a clean `SharePoint Document Location` record with:
  - **Absolute URL:** `https://alphahousecalgaryca.sharepoint.com/sites/ClientDocuments/cp_communityhousinginspection`
  - **Parent Site or Location:** the SharePoint Site record for `/sites/ClientDocuments`
  - **Relative URL:** `cp_communityhousinginspection`
  - **Regarding:** left blank (entity-level)
- **Result:** Helped establish the correct library-level structure, but per-record attachment still needed to happen manually (via **Document Location → Select** on each record's Documents tab), which was not scalable.

### 2.4 Discovery of SharePoint integration failure (OBO token error)
While re-running "Configure server-based SharePoint integration," the wizard failed with:

```
The request was aborted: The request was canceled. Unable to acquire OBO token
```

with error code `-2147088205`.

**Diagnosis:** Checked the Azure AD App Registration ("SharePoint Apps") used for Dynamics ↔ SharePoint server-based integration, under **Entra Admin Center → App registrations → API permissions**. Found it had **only** the default `Microsoft Graph > User.Read (Delegated)` permission — no SharePoint API permissions had ever been granted.

**Fix applied:**
1. Added a new API permission: **SharePoint → Application permissions → `Sites.FullControl.All`**
2. Granted tenant-wide admin consent
3. Re-ran `Configure server-based SharePoint integration` in Dynamics — validation succeeded

> ⚠️ **Note:** `Sites.FullControl.All` is a broad, tenant-wide permission. This should be reviewed/approved by an organizational IT or security admin.

This step likely explains why earlier wizard runs and manual record edits appeared to "not stick" — they were being layered on top of a non-functional authentication channel.

### 2.5 Site migration
During/after resolving the OBO token issue, the working SharePoint site changed from:
```
https://alphahousecalgaryca.sharepoint.com/sites/ClientDocuments
```
to:
```
https://alphahousecalgaryca.sharepoint.com/sites/AlphaHouseSandbox
```
All subsequent configuration (Document Locations, Power Automate flow) was updated to target the new site.

---

## 3. Reference Pattern: How `cp_inspectionitem` Works Correctly

Before building a custom fix, the related entity `cp_inspectionitem` was found to already upload files correctly. Its working configuration was used as the target pattern to replicate:

**Level 1 — Library-level Document Location:**

| Field | Value |
|---|---|
| Name | `Documents on Default Site 1` |
| Parent Site or Location | `Default Site` (the SharePoint Site root record) |
| Relative URL | `cp_inspectionitem` |
| Regarding | *(blank)* |

Resolves to: `.../AlphaHouseSandbox/cp_inspectionitem`

**Level 2 — Record-level Document Location:**

| Field | Value |
|---|---|
| Name | `Documents on Default Site 2` |
| Parent Site or Location | **`Documents on Default Site 1`** (the Level 1 record — NOT the site) |
| Relative URL | `Debbie Callaghan - 4-18-2026 - Front Door _A8071C93...` |
| Regarding | the specific `cp_inspectionitem` record |

Resolves to: `.../AlphaHouseSandbox/cp_inspectionitem/Debbie Callaghan...Front Door...`

**Key insight:** The record-level Document Location's `Parent Site or Location` must point at the **library-level Document Location record**, not directly at the SharePoint Site. This two-level chain is what was missing from `cp_communityhousinginspection`'s configuration.

---

## 4. Final Solution: Power Automate Flow

Since native automatic per-record Document Location creation could not be reliably reproduced/relied upon for `cp_communityhousinginspection`, a **Power Automate cloud flow** was built to explicitly create the folder and Document Location chain on record creation.

**Flow name:** `Community Housing Inspection - Document Upload`

### 4.1 Trigger
**Dataverse: When a row is added, modified or deleted**
- Table name: `Community Housing Inspection`
- Scope: Organization
- Trigger condition: Create

### 4.2 Prerequisite (created once, manually, in Dynamics)
A library-level Document Location record:

| Field | Value |
|---|---|
| Name | `Community Housing Inspection Library` |
| Parent Site or Location | `Default Site` |
| Relative URL | `cp_communityhousinginspection` |
| Regarding | *(blank)* |

### 4.3 Flow steps

1. **Compose — `folder_name`**
   Builds a unique, SharePoint-safe folder name from the record's primary name + GUID, with slashes (common in date-formatted names) sanitized out:
   ```
   replace(
     concat(
       triggerOutputs()?['body/cp_communityhousinginspectionname'],
       '_',
       triggerOutputs()?['body/cp_communityhousinginspectionid']
     ),
     '/', '-'
   )
   ```
   > **Known issue resolved:** Additional `replace()` calls can be nested to strip other SharePoint-forbidden characters (`~ " # % & * : < > ? \ { | }`) if primary names may contain them.

   > **Known issue (unresolved as of last update):** If `cp_communityhousinginspectionname` is not yet fully populated at trigger time (e.g., due to async naming logic), the folder name may build with an incomplete value. Mitigation in progress: adding a **Delay** action (start with 10–30 seconds) followed by a **"Get a row by ID"** Dataverse action to re-fetch the record fresh, then rebuilding `folder_name` from the re-fetched values instead of the original `triggerOutputs()`.

2. **SharePoint — Create new folder**
   - Site Address: `https://alphahousecalgaryca.sharepoint.com/sites/AlphaHouseSandbox`
   - Library Name: `cp_communityhousinginspection`
   - Folder Path: `outputs('folder_name')`

3. **SharePoint — Get folder metadata using path**
   Retrieves the created folder's metadata/path for confirmation (optional if "Create new folder"'s own response already provides what's needed).

4. **Dataverse — List rows** (`list rows - default site` / library lookup)
   - Table: `SharePoint Sites`
   - Filter: `absoluteurl eq 'https://alphahousecalgaryca.sharepoint.com/sites/AlphaHouseSandbox'`
   *(Used earlier in troubleshooting to resolve the root site GUID; retained for reference/validation.)*

5. **Dataverse — List rows** (`List library location`)
   - Table: `Document Locations`
   - Filter: `relativeurl eq 'cp_communityhousinginspection'`
   - Top Count: `1`
   Retrieves the Level 1 library Document Location record (see §4.2) so the new record-level location can be parented to it correctly.

6. **Dataverse — Add a new row** (inside a `For each`, or directly if not iterating)
   - Table name: `Document Locations`
   - **Name:** `outputs('folder_name')`
   - **Relative URL:** `outputs('folder_name')` *(no path prefix / no slashes — see §5.2)*
   - **Parent Site or Location:**
     ```
     concat(
       '/sharepointdocumentlocations(',
       first(outputs('List_library_location')?['body/value'])?['sharepointdocumentlocationid'],
       ')'
     )
     ```
   - **Regarding:**
     ```
     concat(
       '/cp_communityhousinginspections(',
       triggerOutputs()?['body/cp_communityhousinginspectionid'],
       ')'
     )
     ```

---

## 5. Errors Encountered & Fixes (Flow Build)

### 5.1 `ODataUnrecognizedPathException` — bare GUID/number instead of full path
**Symptom:**
```
URL was not parsed due to an ODataUnrecognizedPathException. Resource not found for the segment '6' provided in the URL.
```
**Cause:** `@odata.bind` fields require the full navigation path format `/entityset(guid)`, not a bare GUID or an unrelated numeric value (e.g., accidentally picking an object-type-code field from dynamic content).
**Fix:** Used `concat('/sharepointdocumentlocations(', <guid>, ')')` style expressions for all lookup bindings.

### 5.2 Invalid relative URL characters
**Symptom:**
```
The relative url contains invalid characters... cannot contain any of the following characters: ~ " # % & * : < > ? / \ { | }.
```
**Cause (occurrence 1):** Relative URL was built as a full nested path (`cp_communityhousinginspection/{foldername}`) — the `/` character is explicitly forbidden. Relative URL must be a **single path segment**, relative to whatever is set in `Parent Site or Location`.
**Fix:** Removed the library-name prefix from Relative URL; used the two-level parent chain (§3, §4.3 step 6) instead so each level's Relative URL is just one segment.

**Cause (occurrence 2):** The record's primary name field contained a `/` as part of a date (e.g., `3/20/2026`), which flowed into the folder name string.
**Fix:** Added `replace(..., '/', '-')` sanitization in the `folder_name` Compose step (§4.3 step 1).

### 5.3 `Entity 'sharepointsite' With Id = ... Does Not Exist`
**Symptom:**
```
Entity 'sharepointsite' With Id = 0433f2b7-038d-f111-8076-6045bd60d54a Does Not Exist
```
**Cause:** `Parent Site or Location` is a **polymorphic lookup** (can point to either a `sharepointsite` or a `sharepointdocumentlocation` record). The Power Automate designer's default field binds using the `parentsiteorlocation_sharepointsite@odata.bind` navigation property, which only accepts `sharepointsite` GUIDs. When binding to a Document Location record instead (as required by the two-level parent pattern), the correct navigation property is `parentsiteorlocation_sharepointdocumentlocation@odata.bind`.
**Fix (in progress at last update):** Attempted resolution via Peek code / Code view editing of the action's parameter key. If the designer does not permit editing this key directly, the documented fallback is to replace the "Add a new row" Dataverse action with a raw **HTTP request to the Dataverse Web API** (`POST /api/data/v9.1/sharepointdocumentlocations`) with a manually authored JSON body specifying the correct `@odata.bind` key, authenticated via Azure AD OAuth against the Dataverse environment.

### 5.4 "Folder has been renamed or deleted" despite matching Document Location config
**Symptom:** Document Location record correctly configured (parented to the library location), but the SharePoint library itself was empty — no folder existed at all.
**Cause:** The **"Create new folder"** action was missing from the flow (or was inserted after "Get folder metadata using path" rather than before it), so the flow was reading metadata for / referencing a folder that had never actually been created.
**Fix:** Ensure action order is:
```
folder_name (Compose) → Create new folder (SharePoint) → Get folder metadata using path (SharePoint, optional) → List rows (library lookup) → Add a new row (Dataverse)
```

### 5.5 Folder name built from incomplete/empty primary name field
**Symptom:** SharePoint folder created with a name based only on the record GUID (e.g., `_fb1f20e3-0e8d-f111-8076-6045bd60d54a`) — the human-readable name portion was blank, indicating `cp_communityhousinginspectionname` wasn't populated in the trigger payload yet.
**Status: Unresolved / in progress.**
**Planned fix:** Insert a **Delay** action (10–30 sec, tune as needed) immediately after the trigger, followed by a **Dataverse "Get a row by ID"** action to re-fetch the record, and rebuild `folder_name` from the re-fetched row's outputs instead of `triggerOutputs()`. If timing alone doesn't resolve it, verify the correct schema/logical name for the primary name field via the raw outputs of a test "Get a row by ID" run.
**Interim workaround (if needed for already-created folders):** Use SharePoint's **"Move folder"** action to rename an existing folder to a corrected name (moving to the same parent path with a new name effects a rename), and separately update the corresponding Document Location record's `name` and `relativeurl` fields to match.

---

## 6. Outstanding / Follow-Up Items

- [ ] Confirm the Delay + re-fetch fix resolves the incomplete-name issue (§5.5) with a clean end-to-end test
- [ ] Resolve the polymorphic lookup binding issue (§5.3) — confirm whether Peek code editing works, or finalize the raw HTTP request fallback
- [ ] Backfill existing `cp_communityhousinginspection` records created before the flow existed (Cody Quiring, Calderon Virelli, Alexander Meikle, John Doe, etc.) — either by re-saving each record (if trigger also fires on Modify) or via a one-time bulk flow
- [ ] Revisit the `Default Site` SharePoint Site record's `folderstructureentity: contact` setting — determine whether it's still needed for other entities or can be cleared now that explicit flows handle `cp_communityhousinginspection` and `cp_inspectionitem`
- [ ] Document/replicate this pattern for any other custom entities that may need similar SharePoint document routing in the future

---

## 7. Key Learnings

1. **SharePoint library internal/relative URLs often differ from display names.** Always verify the actual relative URL (visible via library **Settings** page → "Web Address") rather than assuming it matches the human-readable label.
2. **Running the Dynamics document management wizard multiple times without cleanup creates orphaned Document Location records.** Always audit and remove stale records before re-running.
3. **Folder path inheritance from parent entities (e.g., Contact) can silently redirect uploads**, and this fallback can live at the **SharePoint Site record level** (`folderstructureentity` field) — not just in the per-entity wizard checkbox. Both must be checked when diagnosing unwanted nesting.
4. **`Parent Site or Location` on `sharepointdocumentlocation` is a polymorphic lookup.** Binding to a Document Location vs. a Site record requires different `@odata.bind` navigation property names (`parentsiteorlocation_sharepointdocumentlocation` vs. `parentsiteorlocation_sharepointsite`). The Power Automate designer may default to only one of these.
5. **`Relative URL` must be a single path segment**, not a full nested path — forward slashes are explicitly forbidden. Multi-level folder structures are achieved by chaining Document Location records via `Parent Site or Location`, not by encoding depth into one Relative URL.
6. **"Unable to acquire OBO token" errors** in Dynamics/SharePoint integration typically indicate a missing or misconfigured Azure AD App Registration — check **API permissions** (should include SharePoint `Sites.FullControl.All` or similar as an **Application** permission with admin consent granted), not just certificate/secret expiry.
7. **Working sibling entities are valuable diagnostic references.** Reverse-engineering `cp_inspectionitem`'s correctly-functioning two-level Document Location chain provided the exact target pattern needed to fix `cp_communityhousinginspection`.

---

## 8. Quick Reference — Key IDs & URLs

| Item | Value |
|---|---|
| Dynamics org URL | `https://orgebf6398d.crm3.dynamics.com` |
| SharePoint site (current) | `https://alphahousecalgaryca.sharepoint.com/sites/AlphaHouseSandbox` |
| Target library relative URL | `cp_communityhousinginspection` |
| Default Site (sharepointsite) GUID | `634a4c73-5216-f011-998a-002248afc7f3` |
| Power Automate flow | `Community Housing Inspection - Document Upload` |
| Reference/working entity | `cp_inspectionitem` |
