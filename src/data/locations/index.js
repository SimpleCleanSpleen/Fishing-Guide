// Location registry. Each location is ONE JSON file in this folder with its map
// center, suggested spots, local regulations and advisories. To add a new city:
//   1. Copy clarksville-tn.json to e.g. knoxville-tn.json and edit it.
//   2. Import it below and add it to LOCATIONS.
// Everything else (map, weather, river gauges, fish guide, insights) adapts.
import clarksville from './clarksville-tn.json';
import elkridge from './elkridge-md.json';
import severn from './severn-md.json';

export const LOCATIONS = [clarksville, elkridge, severn];
export const DEFAULT_LOCATION_ID = 'clarksville-tn';
export const getLocation = (id) => LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
