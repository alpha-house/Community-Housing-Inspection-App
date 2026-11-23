# Deployment Notes — Community Housing table and client import

Solution: **Community Housing Inspection** (`CommunityHousingInspection`), unmanaged export in
[`solutions/CommunityHousingInspection/`](../solutions/CommunityHousingInspection/). Built and
tested in **Alpha House Sandbox**; target UAT, then Prod. Schema details are in
[Dataverse-Schema-Spec.md](../Dataverse-Schema-Spec.md) §8–§10.

## What's new

1. **Community Housing table** (`cp_communityhousing`) — one record per client tenancy
   (pod, team lead, unit, building address, move-in / lease dates, rent, client amount,
   Alpha subsidy, landlord details, EFT/Cheque).
   - Client lookup to Client (contact), one client → many Community Housing records.
   - Team Lead lookup to Staff (`cp_staff`).
   - Global choices **Pod** (`cp_pod`: Core, HL, NE, NW, SE, SW) and **EFT/Cheque**
     (`cp_paymentmethod`: EFT, Cheque).
   - Main form, quick create form, and views; added to the Community Housing Inspection app
     after Contacts. Clients show their Community Housing records under **Related**.
2. **Community Housing - Set Name** flow — sets Name to `<client full name> <building address>`
   when a record is added or its Client / Building Address changes.
3. **Update Community Housing and Client Records** flow (instant) — imports
   `community_housing_clients.xlsx` from SharePoint:
   - Finds the client by **HMIS ID**; creates the client if missing (Date of Birth Unknown = Yes).
   - Creates the Community Housing record, or updates it if the client already has one at the
     same building address — safe to re-run, no duplicates.
   - Rows with no HMIS ID ("Alpha House" placeholder units) get a record with no client.
   - **Row limit** input: process only the first N rows (blank = all). Use a small number for a
     first test in each environment.

## Before importing

- [ ] Confirm the target environment has the **Staff** table and the contact columns
      `cp_hmisfilenumber`, `cp_dateofbirth`, `cp_dateofbirthunknown` (they come from other solutions).
- [ ] Make sure the account that will own the flows has access to the SharePoint site
      **AHCDocuments** → library **Community Housing Inspection** → `community_housing_clients.xlsx`.

## Import steps

1. Import the solution. When prompted for connection references:
   - **Dataverse** — `ahb_sharedcommondataserviceforapps_c4d89`
   - **Excel Online (Business) Community Housing Inspection** — `cp_sharedexcelonlinebusiness_chi01`.
     Pick a connection for an account that can open the workbook (in Sandbox this was Data@).
2. Publish all customizations.
3. Turn on **Community Housing - Set Name** and **Update Community Housing and Client Records**.
4. In the maker portal, open Community Housing → Views → **Quick Find** and add Building Address,
   Unit #, Landlord and Main Contact under *Find by* (the API could not set these).

## Things to know

- **The flow edits the workbook once.** The Excel connector only reads named tables; on its
  first run the flow adds a table `CommunityHousingClients` over `A1:R1000` of the first
  worksheet. This already happened to the shared file during Sandbox testing, so UAT/Prod will
  find the table and skip this step. Keep new rows inside the table (type directly under it).
- **The file location is fixed in the flow** (site, library and file ids). If the workbook is
  moved, renamed or replaced, the flow must be updated.
- **Team Lead** is only set when exactly one active Staff name starts with the sheet value
  ("Roda", "James", "Dalal"). Sandbox staff names are anonymised, so it was blank in testing —
  check the result in UAT; names that match several staff (e.g. two "James") stay blank.
- **Dates:** text like "July 1st 2025", "Dec 1st 2024", "05/31/2025" is converted. Values that
  aren't dates or have impossible years go to **Move-in Date Other** / **Lease Expiry Other**
  (e.g. "Rehouse", "Month to Month", "Feb 1st 2205", "February 29th 2025").
- **Amounts** keep only the leading number ("1424 \*\* GIVE TO PAUL T\*\*" → 1424).
- **Landlord email** is skipped when it has no "@" (e.g. Andrew Mills' row has "3").
- A full run of 178 rows takes about 5 minutes.

## Sandbox test results (2026-11-23)

Runs started from Power Automate via Playwright as Data@alphahousecalgary.com; all succeeded.

| Run | Rows | Result |
|---|---|---|
| 1 | 14 | Table created; 5 clients, 14 housing records. Found and fixed: Unit # missing, Excel serial date (`45961`), invalid emails |
| 2 | 14 | Fixes confirmed |
| 3 | All 178 | 169 clients, 178 housing records; every field matched the sheet |
| 4 | All 178 | 0 created, 178 updated (no duplicates) |
| 5 | 14 | Re-test after fixing designer "invalid parameters" error; Flow checker 0 errors / 0 warnings |

All test clients and housing records were deleted afterwards.

## Rollback

Turn off both flows. Records created by the import can be removed by deleting Community Housing
records and the contacts created on the import date with an HMIS ID from the sheet. The
`CommunityHousingClients` table in the workbook can be left in place (or converted back to a
range in Excel).
