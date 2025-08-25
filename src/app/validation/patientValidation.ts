import { z } from 'zod';

// Regex patterns
const phoneRegex = /^\d{10}$/;
const nameRegex = /^[A-Za-z .'-]{2,50}$/;
const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
const ssnRegex = /^(\d{3}-\d{2}-\d{4}|\d{9})$/;
// const ssnRegex = /^(?!666|000|9\d{2})\d{3}(?!00)\d{2}(?!0{4})\d{4}$/;
const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
const zipRegex = /^\d{5}(-\d{4})?$/;
const stateRegex = /^(?:A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[ADLN]|K[SY]|LA|M[EDAINSOT]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$/;


// Using libphonenumber-js
import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function validateAndFormatPhone(raw: string, country?: string) {
  // country like 'US', 'IN', 'GB'; omit if raw has +country code
//   const phone = parsePhoneNumberFromString(raw, country as any)
//   if (!phone) return { valid: false, error: 'Not a number' }

//   // Library checks both “possible” and “valid” patterns per region
//   if (!phone.isPossible()) return { valid: false, error: 'Number not possible' }
//   if (!phone.isValid()) return { valid: false, error: 'Number not valid' }

//   // Canonical E.164 for storage
//   const e164 = phone.number // same as phone.format('E.164')
  return { valid: true}
}
// Zod schema
export const PatientValidationSchema = z.object({
  firstName: z.string().regex(nameRegex, 'First name must be 2-50 letters, spaces, hyphens, apostrophes, or periods.'),
  lastName: z.string().regex(nameRegex, 'Last name must be 2-50 letters, spaces, hyphens, apostrophes, or periods.'),
  phone: z.string(), // phone validation will be handled in refinement below
  email: z.string().regex(emailRegex, 'Invalid email address.'),
  ssn: z.string().regex(ssnRegex, 'SSN must be XXX-XX-XXXX or XXXXXXXXX.'),
  dob: z.string().regex(dateRegex, 'Date of birth must be MM/DD/YYYY.'),
  zip: z.string().regex(zipRegex, 'ZIP code must be XXXXX or XXXXX-XXXX.'),
  state: z.string().regex(stateRegex, 'State must be a valid two-letter code.'),
  country: z.string().min(2, 'Country is required.'),
  // Add other fields as needed
}).refine((data) => {
    const isValid = validateAndFormatPhone(data.phone, data.country.toUpperCase())
  // Country-specific phone validation
//   if (data.country.toUpperCase() === 'US') {
//     return phoneRegex.test(data.phone);
//   }
//   if (data.country.toUpperCase() === 'IN') {
//     // India: 10 digits, starts with 6-9
//     return /^([6-9]\d{9})$/.test(data.phone);
//   }
//   if (data.country.toUpperCase() === 'UK') {
//     // UK: 10 or 11 digits, starts with 0
//     return /^0\d{9,10}$/.test(data.phone);
//   }
//   // Default: allow 6-15 digits for other countries
//   return /^\d{6,15}$/.test(data.phone);
return isValid?.valid
}, {
  message: 'Phone number format is invalid for the selected country.',
  path: ['phone']
});

// Individual field validation
export function validateField(field: string, value: string) {
  switch (field) {
    case 'firstName':
    case 'lastName':
      return {
        isValid: nameRegex.test(value),
        error: nameRegex.test(value) ? null : 'Name must be 2-50 valid characters.'
      };
    case 'phone':
      return {
        isValid: phoneRegex.test(value),
        error: phoneRegex.test(value) ? null : 'Phone must be exactly 10 digits.'
      };
    case 'email':
      return {
        isValid: emailRegex.test(value),
        error: emailRegex.test(value) ? null : 'Invalid email address.'
      };
    case 'ssn':
      return {
        isValid: ssnRegex.test(value),
        error: ssnRegex.test(value) ? null : 'SSN must be XXX-XX-XXXX or XXXXXXXXX.'
      };
    case 'dob':
      return {
        isValid: dateRegex.test(value),
        error: dateRegex.test(value) ? null : 'Date must be MM/DD/YYYY.'
      };
    case 'zip':
      return {
        isValid: zipRegex.test(value),
        error: zipRegex.test(value) ? null : 'ZIP must be XXXXX or XXXXX-XXXX.'
      };
    case 'state':
      return {
        isValid: stateRegex.test(value),
        error: stateRegex.test(value) ? null : 'State must be a valid two-letter code.'
      };
    default:
      return { isValid: true, error: null };
  }
}
