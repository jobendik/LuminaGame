import { IRegionData, RegionId } from '../types';

export const REGIONS: IRegionData[] = [
  {
    id: RegionId.SILENT_PLAINS,
    name: 'Silent Plains',
    palette: {
      primary: 0x88aadd,
      secondary: 0x556688,
      accent: 0xaaccff,
      background: 0x0a0a2e,
    },
    mechanicModifier: undefined,
    soundscape: 'ambient-plains',
  },
  {
    id: RegionId.ECHO_FOREST,
    name: 'Echo Forest',
    palette: {
      primary: 0x66aa88,
      secondary: 0x446655,
      accent: 0x88ddaa,
      background: 0x0a1a0e,
    },
    mechanicModifier: 'echo',
    soundscape: 'ambient-forest',
  },
  {
    id: RegionId.SUNKEN_RUINS,
    name: 'Sunken Ruins',
    palette: {
      primary: 0x8888bb,
      secondary: 0x555577,
      accent: 0xaaaadd,
      background: 0x0a0a1e,
    },
    mechanicModifier: 'water',
    soundscape: 'ambient-ruins',
  },
  {
    id: RegionId.SKY_FRACTURE,
    name: 'Sky Fracture',
    palette: {
      primary: 0xddaa66,
      secondary: 0x886644,
      accent: 0xffcc88,
      background: 0x1e1a0a,
    },
    mechanicModifier: 'wind',
    soundscape: 'ambient-sky',
  },
  {
    id: RegionId.CORE_VEIL,
    name: 'Core Veil',
    palette: {
      primary: 0xdd88aa,
      secondary: 0x885566,
      accent: 0xffaacc,
      background: 0x1e0a1a,
    },
    mechanicModifier: 'spirit',
    soundscape: 'ambient-core',
  },
];
