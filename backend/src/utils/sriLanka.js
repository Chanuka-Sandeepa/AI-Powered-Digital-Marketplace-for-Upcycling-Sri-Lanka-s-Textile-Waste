// Sri Lanka's 9 provinces and 25 districts, used to (a) offer sensible
// dropdown values in the seller-facing upload form and (b) provide a
// district -> province lookup so the sustainability model always gets a
// consistent, valid pair of values even if only a district is supplied.

export const DISTRICT_TO_PROVINCE = {
  Colombo: 'Western',
  Gampaha: 'Western',
  Kalutara: 'Western',
  Kandy: 'Central',
  Matale: 'Central',
  'Nuwara Eliya': 'Central',
  Galle: 'Southern',
  Matara: 'Southern',
  Hambantota: 'Southern',
  Jaffna: 'Northern',
  Kilinochchi: 'Northern',
  Mannar: 'Northern',
  Vavuniya: 'Northern',
  Mullaitivu: 'Northern',
  Batticaloa: 'Eastern',
  Ampara: 'Eastern',
  Trincomalee: 'Eastern',
  Kurunegala: 'North Western',
  Puttalam: 'North Western',
  Anuradhapura: 'North Central',
  Polonnaruwa: 'North Central',
  Badulla: 'Uva',
  Monaragala: 'Uva',
  Ratnapura: 'Sabaragamuwa',
  Kegalle: 'Sabaragamuwa',
};

export const DISTRICTS = Object.keys(DISTRICT_TO_PROVINCE);

export const PROVINCES = [...new Set(Object.values(DISTRICT_TO_PROVINCE))];

export const INDUSTRY_TYPES = [
  'Apparel Manufacturing',
  'Textile Mill',
  'Garment Factory',
  'Fabric Wholesaler',
  'Fashion Retailer',
  'Home Textiles',
  'Other',
];

/**
 * Given a free-text location string (e.g. "Colombo, Sri Lanka"), find the
 * best-matching known district. Falls back to Colombo/Western, which keeps
 * the ML sustainability pipeline's categorical inputs valid even for
 * unrecognized locations.
 */
export function resolveDistrictProvince(locationText = '') {
  const text = locationText.toLowerCase();
  for (const district of DISTRICTS) {
    if (text.includes(district.toLowerCase())) {
      return { district, province: DISTRICT_TO_PROVINCE[district] };
    }
  }
  return { district: 'Colombo', province: 'Western' };
}
