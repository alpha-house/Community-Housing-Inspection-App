/**
 * Single source of truth for the 41-row checklist defined by
 * community_housing_inspection_template.docx. Row order (lineNumber) and
 * section colors match the template's accent-colored tables exactly.
 */

export enum ConditionType {
  GoodFairPoor = "GFP",
  PassFail = "PF",
  YesNo = "YN",
}

export const CONDITION_VALUE = {
  Good: 121570000,
  Fair: 121570001,
  Poor: 121570002,
  Pass: 121570003,
  Fail: 121570004,
  Yes: 121570005,
  No: 121570006,
  NotApplicable: 121570007,
} as const;

/**
 * "N/A" is appended to every condition type's option list (not just its own type) so users
 * always have a way to clear a previously-selected Condition back to a blank-equivalent state
 * - the Dropdown itself has no "clear selection" gesture, so N/A stands in for null.
 */
const NOT_APPLICABLE_OPTION = { label: "N/A", value: CONDITION_VALUE.NotApplicable };

export const CONDITION_OPTIONS: Record<ConditionType, { label: string; value: number }[]> = {
  [ConditionType.GoodFairPoor]: [
    { label: "Good", value: CONDITION_VALUE.Good },
    { label: "Fair", value: CONDITION_VALUE.Fair },
    { label: "Poor", value: CONDITION_VALUE.Poor },
    NOT_APPLICABLE_OPTION,
  ],
  [ConditionType.PassFail]: [
    { label: "Pass", value: CONDITION_VALUE.Pass },
    { label: "Fail", value: CONDITION_VALUE.Fail },
    NOT_APPLICABLE_OPTION,
  ],
  [ConditionType.YesNo]: [
    { label: "Yes", value: CONDITION_VALUE.Yes },
    { label: "No", value: CONDITION_VALUE.No },
    NOT_APPLICABLE_OPTION,
  ],
};

export const AREA_VALUE = {
  Entry: 121570000,
  LivingRoom: 121570001,
  Kitchen: 121570002,
  Bathroom: 121570003,
  Bedroom: 121570004,
  Laundry: 121570005,
  BalconyPatio: 121570006,
  General: 121570007,
  Bedroom2: 121570008,
} as const;

export const ITEM_VALUE = {
  FrontDoor: 121570000,
  LocksAndDeadbolt: 121570001,
  LightFixtures: 121570002,
  WallsAndCeilings: 121570003,
  Flooring: 121570004,
  SmokeDetector: 121570005,
  WallsCeiling: 121570006,
  Walls: 121570007,
  Ceiling: 121570008,
  Windows: 121570009,
  WindowCoverings: 121570010,
  ElectricalOutlets: 121570012,
  HeatingVent: 121570013,
  Cabinets: 121570014,
  Countertops: 121570015,
  Sink: 121570016,
  Faucet: 121570017,
  StoveOven: 121570018,
  Refrigerator: 121570019,
  Dishwasher: 121570020,
  PestEvidence: 121570022,
  Toilet: 121570023,
  TubShower: 121570024,
  ExhaustFan: 121570025,
  Closet: 121570026,
  WasherDryer: 121570027,
  DoorAndLock: 121570028,
  SurfaceCondition: 121570029,
  Odours: 121570030,
  Cleaning: 121570031,
} as const;

export interface ChecklistRowTemplate {
  lineNumber: number;
  areaLabel: string;
  areaValue: number;
  itemLabel: string;
  itemValue: number;
  questionLabel: string;
  questionValue: number;
  conditionType: ConditionType;
  hasPhotoTaken: boolean;
}

export interface SectionTemplate {
  key: string;
  title: string;
  color: string;
  /** Pale tint of `color`, used for zebra-striped row backgrounds. */
  lightColor: string;
  rows: ChecklistRowTemplate[];
}

const GFP = ConditionType.GoodFairPoor;
const PF = ConditionType.PassFail;
const YN = ConditionType.YesNo;

export const SECTIONS: SectionTemplate[] = [
  {
    key: "entry",
    title: "Entry / Hallway",
    color: "#4472C4",
    lightColor: "#DCE6F7",
    rows: [
      { lineNumber: 1, areaLabel: "Entry", areaValue: AREA_VALUE.Entry, itemLabel: "Front Door", itemValue: ITEM_VALUE.FrontDoor, questionLabel: "Does door close fully? Scratches, dents, peeling paint, loose hinges, damaged frame, lock functioning properly?", questionValue: 121570000, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 2, areaLabel: "Entry", areaValue: AREA_VALUE.Entry, itemLabel: "Locks & Deadbolt", itemValue: ITEM_VALUE.LocksAndDeadbolt, questionLabel: "Does key work? Deadbolt secure? Door latch aligned?", questionValue: 121570001, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 3, areaLabel: "Entry", areaValue: AREA_VALUE.Entry, itemLabel: "Light Fixture", itemValue: ITEM_VALUE.LightFixtures, questionLabel: "Turn on/off. Bulb burnt out? Fixture cracked, flickering, loose, missing cover?", questionValue: 121570002, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 4, areaLabel: "Entry", areaValue: AREA_VALUE.Entry, itemLabel: "Walls & Ceilings", itemValue: ITEM_VALUE.WallsAndCeilings, questionLabel: "Holes, dents, stains, cracks, peeling paint, water damage?", questionValue: 121570003, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 5, areaLabel: "Entry", areaValue: AREA_VALUE.Entry, itemLabel: "Flooring", itemValue: ITEM_VALUE.Flooring, questionLabel: "Scratches, stains, lifting, cracked tiles, soft spots, tripping hazards?", questionValue: 121570004, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 6, areaLabel: "Entry", areaValue: AREA_VALUE.Entry, itemLabel: "Smoke Detector", itemValue: ITEM_VALUE.SmokeDetector, questionLabel: "Tested and functioning? Battery chirping? Expiry date valid?", questionValue: 121570005, conditionType: PF, hasPhotoTaken: true },
    ],
  },
  {
    key: "livingroom",
    title: "Living Room",
    color: "#ED7D31",
    lightColor: "#FDEBDD",
    rows: [
      { lineNumber: 7, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Flooring", itemValue: ITEM_VALUE.Flooring, questionLabel: "Carpet stains, burns, odours, lifting edges, scratches, cracked flooring?", questionValue: 121570006, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 8, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Walls", itemValue: ITEM_VALUE.Walls, questionLabel: "Holes, dents, stains, nail holes, paint damage?", questionValue: 121570007, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 9, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Ceiling", itemValue: ITEM_VALUE.Ceiling, questionLabel: "Water stains, cracks, peeling paint?", questionValue: 121570008, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 10, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Windows", itemValue: ITEM_VALUE.Windows, questionLabel: "Open/close properly? Locks functioning? Cracked glass? Screen damaged?", questionValue: 121570009, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 11, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Window Coverings", itemValue: ITEM_VALUE.WindowCoverings, questionLabel: "Blinds working? Missing slats? Damaged curtains?", questionValue: 121570010, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 12, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Light Fixtures", itemValue: ITEM_VALUE.LightFixtures, questionLabel: "All bulbs functioning? Fixture damaged, flickering, loose?", questionValue: 121570011, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 13, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Electrical Outlets", itemValue: ITEM_VALUE.ElectricalOutlets, questionLabel: "Test outlets. Cover plates cracked/missing?", questionValue: 121570012, conditionType: PF, hasPhotoTaken: true },
      { lineNumber: 14, areaLabel: "Living Room", areaValue: AREA_VALUE.LivingRoom, itemLabel: "Heating Vent", itemValue: ITEM_VALUE.HeatingVent, questionLabel: "Airflow functioning? Vent blocked or damaged?", questionValue: 121570013, conditionType: GFP, hasPhotoTaken: true },
    ],
  },
  {
    key: "kitchen",
    title: "Kitchen / Dining Room",
    color: "#FFC000",
    lightColor: "#FFF3D6",
    rows: [
      { lineNumber: 15, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Cabinets", itemValue: ITEM_VALUE.Cabinets, questionLabel: "Scratches, broken hinges, loose handles, water damage, shelves damaged?", questionValue: 121570014, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 16, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Countertops", itemValue: ITEM_VALUE.Countertops, questionLabel: "Burns, cuts, stains, lifting seams, cracks?", questionValue: 121570015, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 17, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Sink", itemValue: ITEM_VALUE.Sink, questionLabel: "Drain properly? Leaks under sink? Caulking damaged?", questionValue: 121570016, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 18, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Faucet", itemValue: ITEM_VALUE.Faucet, questionLabel: "Hot/cold water working? Leaking? Loose faucet?", questionValue: 121570017, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 19, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Stove/Oven", itemValue: ITEM_VALUE.StoveOven, questionLabel: "Test burners and oven. Missing knobs/racks? Excess grease? Broken glass?", questionValue: 121570018, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 20, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Refrigerator", itemValue: ITEM_VALUE.Refrigerator, questionLabel: "Cooling properly? Shelves cracked? Door seals damaged? Clean inside?", questionValue: 121570019, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 21, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Dishwasher", itemValue: ITEM_VALUE.Dishwasher, questionLabel: "Run test cycle. Leaks? Drain properly? Racks damaged?", questionValue: 121570020, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 22, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Flooring", itemValue: ITEM_VALUE.Flooring, questionLabel: "Water damage, cracked tiles, lifting flooring?", questionValue: 121570021, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 23, areaLabel: "Kitchen", areaValue: AREA_VALUE.Kitchen, itemLabel: "Pest Evidence", itemValue: ITEM_VALUE.PestEvidence, questionLabel: "Any insects, droppings, food contamination signs?", questionValue: 121570022, conditionType: YN, hasPhotoTaken: true },
    ],
  },
  {
    key: "bathroom",
    title: "Bathroom",
    color: "#70AD47",
    lightColor: "#E5F2DC",
    rows: [
      { lineNumber: 24, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Toilet", itemValue: ITEM_VALUE.Toilet, questionLabel: "Flush properly? Running continuously? Leaks at base? Loose seat?", questionValue: 121570023, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 25, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Sink", itemValue: ITEM_VALUE.Sink, questionLabel: "Drain properly? Leaks? Cracks/chips?", questionValue: 121570024, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 26, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Faucet", itemValue: ITEM_VALUE.Faucet, questionLabel: "Hot/cold functioning? Water pressure acceptable?", questionValue: 121570025, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 27, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Tub/Shower", itemValue: ITEM_VALUE.TubShower, questionLabel: "Caulking damaged? Cracked tile? Drain slow? Shower door damaged?", questionValue: 121570026, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 28, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Exhaust Fan", itemValue: ITEM_VALUE.ExhaustFan, questionLabel: "Working properly? Loud noise? Dust buildup?", questionValue: 121570027, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 29, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Flooring", itemValue: ITEM_VALUE.Flooring, questionLabel: "Soft spots, loose tiles, water damage?", questionValue: 121570028, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 30, areaLabel: "Bathroom", areaValue: AREA_VALUE.Bathroom, itemLabel: "Walls/Ceiling", itemValue: ITEM_VALUE.WallsCeiling, questionLabel: "Mold, mildew, peeling paint, water stains?", questionValue: 121570029, conditionType: GFP, hasPhotoTaken: true },
    ],
  },
  {
    key: "bedroom",
    title: "Bedroom #1",
    color: "#5B9BD5",
    lightColor: "#E8F1FA",
    rows: [
      { lineNumber: 31, areaLabel: "Bedroom", areaValue: AREA_VALUE.Bedroom, itemLabel: "Flooring", itemValue: ITEM_VALUE.Flooring, questionLabel: "Carpet stains, burns, odours, scratches?", questionValue: 121570030, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 32, areaLabel: "Bedroom", areaValue: AREA_VALUE.Bedroom, itemLabel: "Walls", itemValue: ITEM_VALUE.Walls, questionLabel: "Holes, dents, marks, paint damage?", questionValue: 121570031, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 33, areaLabel: "Bedroom", areaValue: AREA_VALUE.Bedroom, itemLabel: "Windows", itemValue: ITEM_VALUE.Windows, questionLabel: "Locks working? Cracked glass? Screen damaged?", questionValue: 121570032, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 34, areaLabel: "Bedroom", areaValue: AREA_VALUE.Bedroom, itemLabel: "Closet", itemValue: ITEM_VALUE.Closet, questionLabel: "Shelves secure? Doors functioning? Damage inside closet?", questionValue: 121570033, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 35, areaLabel: "Bedroom", areaValue: AREA_VALUE.Bedroom, itemLabel: "Light Fixture", itemValue: ITEM_VALUE.LightFixtures, questionLabel: "Bulb functioning? Fixture damaged?", questionValue: 121570034, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 36, areaLabel: "Bedroom", areaValue: AREA_VALUE.Bedroom, itemLabel: "Smoke Detector", itemValue: ITEM_VALUE.SmokeDetector, questionLabel: "Tested and operational?", questionValue: 121570035, conditionType: PF, hasPhotoTaken: true },
    ],
  },
  {
    key: "bedroom2",
    title: "Bedroom #2",
    color: "#5B9BD5",
    lightColor: "#E8F1FA",
    rows: [
      { lineNumber: 42, areaLabel: "Bedroom-2", areaValue: AREA_VALUE.Bedroom2, itemLabel: "Flooring", itemValue: ITEM_VALUE.Flooring, questionLabel: "Carpet stains, burns, odours, scratches?", questionValue: 121570030, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 43, areaLabel: "Bedroom-2", areaValue: AREA_VALUE.Bedroom2, itemLabel: "Walls", itemValue: ITEM_VALUE.Walls, questionLabel: "Holes, dents, marks, paint damage?", questionValue: 121570031, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 44, areaLabel: "Bedroom-2", areaValue: AREA_VALUE.Bedroom2, itemLabel: "Windows", itemValue: ITEM_VALUE.Windows, questionLabel: "Locks working? Cracked glass? Screen damaged?", questionValue: 121570032, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 45, areaLabel: "Bedroom-2", areaValue: AREA_VALUE.Bedroom2, itemLabel: "Closet", itemValue: ITEM_VALUE.Closet, questionLabel: "Shelves secure? Doors functioning? Damage inside closet?", questionValue: 121570033, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 46, areaLabel: "Bedroom-2", areaValue: AREA_VALUE.Bedroom2, itemLabel: "Light Fixture", itemValue: ITEM_VALUE.LightFixtures, questionLabel: "Bulb functioning? Fixture damaged?", questionValue: 121570034, conditionType: GFP, hasPhotoTaken: true },
      { lineNumber: 47, areaLabel: "Bedroom-2", areaValue: AREA_VALUE.Bedroom2, itemLabel: "Smoke Detector", itemValue: ITEM_VALUE.SmokeDetector, questionLabel: "Tested and operational?", questionValue: 121570035, conditionType: PF, hasPhotoTaken: true },
    ],
  },
  {
    key: "common",
    title: "Additional Common Areas",
    color: "#A5A5A5",
    lightColor: "#F0F0F0",
    rows: [
      { lineNumber: 37, areaLabel: "Laundry", areaValue: AREA_VALUE.Laundry, itemLabel: "Washer/Dryer", itemValue: ITEM_VALUE.WasherDryer, questionLabel: "Run test cycle? Excess noise/vibration? Leaks? Missing knobs?", questionValue: 121570036, conditionType: GFP, hasPhotoTaken: false },
      { lineNumber: 38, areaLabel: "Balcony/Patio", areaValue: AREA_VALUE.BalconyPatio, itemLabel: "Door & Lock", itemValue: ITEM_VALUE.DoorAndLock, questionLabel: "Opens/closes properly? Lock functioning?", questionValue: 121570037, conditionType: GFP, hasPhotoTaken: false },
      { lineNumber: 39, areaLabel: "Balcony/Patio", areaValue: AREA_VALUE.BalconyPatio, itemLabel: "Surface Condition", itemValue: ITEM_VALUE.SurfaceCondition, questionLabel: "Cracks, loose boards, trip hazards?", questionValue: 121570038, conditionType: GFP, hasPhotoTaken: false },
      { lineNumber: 40, areaLabel: "General", areaValue: AREA_VALUE.General, itemLabel: "Odours", itemValue: ITEM_VALUE.Odours, questionLabel: "Smoke, pet, mold, garbage, sewage smell?", questionValue: 121570039, conditionType: PF, hasPhotoTaken: false },
      { lineNumber: 41, areaLabel: "General", areaValue: AREA_VALUE.General, itemLabel: "Cleaning", itemValue: ITEM_VALUE.Cleaning, questionLabel: "Is unit free of clutter? Is it easily accessible in case of an emergency?", questionValue: 121570040, conditionType: GFP, hasPhotoTaken: false },
    ],
  },
];

export const ALL_ROWS: ChecklistRowTemplate[] = SECTIONS.flatMap((s) => s.rows);
