// Mirrors backend/src/utils/sriLanka.js - kept here so the seller upload
// form can offer real dropdown choices that line up with what the
// sustainability ML model expects (district / province / industry type).

export const DISTRICT_TO_PROVINCE: Record<string, string> = {
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

export const INDUSTRY_TYPES = [
  'Apparel Manufacturing',
  'Textile Mill',
  'Garment Factory',
  'Fabric Wholesaler',
  'Fashion Retailer',
  'Home Textiles',
  'Other',
];

export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
