import { NextRequest, NextResponse } from 'next/server';
import { PatientValidationSchema } from '@/app/validation/patientValidation';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Map incoming data to validation schema
  const validationResult = PatientValidationSchema.safeParse({
    firstName: body.PatientInformation?.FirstName,
    lastName: body.PatientInformation?.LastName,
    phone: body.PatientInformation?.PhoneNumber,
    email: body.PatientInformation?.EmailID,
    ssn: body.PatientInformation?.SSN,
    dob: body.PatientInformation?.DateOfBirth,
    zip: body.Address?.ZipCode,
    state: body.Address?.State,
    country: body.Address?.Country,
    // Add other fields as needed
  });

  if (!validationResult.success) {
    return NextResponse.json(
      { error: validationResult.error.errors },
      { status: 400 }
    );
  }

  // All common server-side validation passed
  // TODO: Add DB uniqueness checks, business logic, etc.

  return NextResponse.json({ success: true });
}
