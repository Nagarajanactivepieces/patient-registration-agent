import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { PatientValidationSchema } from '../validation/patientValidation';

// ---- Interfaces ----
interface PatientInformation {
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  SSN: string;
  EmailID: string;
  MaritalStatus: string;
  PhoneNumber: string;
}

interface Address {
  Type: string;
  AddressLine1: string;
  City: string;
  State: string;
  Country: string;
  ZipCode: string;
}

interface FullPatientData {
  PatientInformation: PatientInformation;
  Address: Address;
}

// ---- Network Error Helpers ----
const NETWORK_ERROR_MESSAGES = [
  'Failed to fetch',
  'Network Error',
  'NetworkError when attempting to fetch resource',
  'Load failed',
  'network error',
  'Connection failed',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT'
];

function isNetworkError(error: Error): boolean {
  return NETWORK_ERROR_MESSAGES.some(msg =>
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
}

// ---- Retry Fetch Helper ----
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  delay = 1000
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // 'Cache-Control': 'no-cache',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed:`, error.message);

      if (attempt === maxRetries || !isNetworkError(error)) {
        throw error;
      }

      const waitTime = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries exceeded');
}

export const patientDetailsAgent = new RealtimeAgent({
  name: 'patientDetailsCollector',
  voice: 'alloy',
  handoffDescription:
    'Compassionate healthcare assistant who conducts natural, empathetic patient registration conversations with human-like understanding and emotional intelligence.',

  instructions: `
You are a warm, patient, and genuinely helpful patient registration assistant.
Your goal is to collect basic patient details conversationally, never sounding like you're reading a form.

**Tone:** Friendly, empathetic, conversational.
**Flow:** Follow these numbered steps:

1. **Start the Conversation** 
   - Greet warmly: "Hi! This is Alexa from the patient registration team..." 
   - Check if it's a good time to talk.

2. **Collect Information in a Natural Flow** 
   - Ask for each field in this order: FirstName, LastName, DOB, SSN, Email, Marital Status, Phone, AddressType, Street, City, State, Country, Zip.
   - Connect your questions naturally, referencing earlier answers.

3. **Be Human – Key Tips** 
   - Reference what they've said: "Since you're in Texas, I assume this is a US address?"
   - Use their name: "Thanks, Sarah."
   - Show progress: "Just the address info left!"
   - Handle emotions:
     - Nervous → "Take your time, no rush."
     - Apologetic → "No worries at all, happens to everyone."
     - Confused → "Let me explain what I mean…"

4. **Smart Duplicate Handling** 
   - If they repeat info → confirm it's the same. 
   - If they give the same value when trying to change it → clarify. 
   - If they update → confirm change.

5. **Final Confirmation** 
   - Summarize all collected info. 
   - Confirm if correct or if changes are needed.

6. **Your Goal** 
   - Make them feel comfortable, listened to, and confident in the process. 
   - End positively: "Perfect! I'll save all that information right now."

Always adapt based on what's already collected in memory.
If patient asks why info is needed → explain simply and reassure confidentiality.
`,

  tools: [
    tool({
      name: 'save_patient_details',
      description: 'Save the collected patient details to the medical records system.',
      parameters: {
        type: 'object',
        properties: {
          PatientInformation: {
            type: 'object',
            properties: {
              FirstName: { type: 'string' },
              LastName: { type: 'string' },
              DateOfBirth: { type: 'string' },
              SSN: { type: 'string' },
              EmailID: { type: 'string' },
              MaritalStatus: { type: 'string' },
              PhoneNumber: { type: 'string' },
            },
            required: [
              'FirstName',
              'LastName',
              'DateOfBirth',
              'SSN',
              'EmailID',
              'MaritalStatus',
              'PhoneNumber'
            ],
            additionalProperties: false
          },
          Address: {
            type: 'object',
            properties: {
              Type: { type: 'string' },
              AddressLine1: { type: 'string' },
              City: { type: 'string' },
              State: { type: 'string' },
              Country: { type: 'string' },
              ZipCode: { type: 'string' },
            },
            required: [
              'Type',
              'AddressLine1',
              'City',
              'State',
              'Country',
              'ZipCode'
            ],
            additionalProperties: false
          }
        },
        required: ['PatientInformation', 'Address'],
        additionalProperties: false
      },
      execute: async (input: unknown) => {
        const data = input as FullPatientData;
console.log(data,'Received patient data to save:', JSON.stringify(data, null, 2));
        // Client-side validation before API call
        const validationResult = PatientValidationSchema.safeParse({
          firstName: data.PatientInformation.FirstName,
          lastName: data.PatientInformation.LastName,
          phone: data.PatientInformation.PhoneNumber,
          email: data.PatientInformation.EmailID,
          ssn: data.PatientInformation.SSN,
          dob: data.PatientInformation.DateOfBirth,
          zip: data.Address.ZipCode,
          state: data.Address.State,
          country: data.Address.Country
        });
        console.log('Validation result:', validationResult);
        if (!validationResult.success) {
          const errors = validationResult.error.errors.map(err =>
            `${err.path.join('.')}: ${err.message}`
          ).join(', ');
          return {
            success: false,
            error: `Validation failed: ${errors}`,
            disconnect: false,
            message: `I'm sorry, but there are some issues with the information provided: ${errors}. Could you please provide the correct information?`
          };
        }

        try {
          console.log('Saving patient data:', JSON.stringify(data, null, 2));

          const response = await fetchWithRetry(
            'https://deployment.tekclansolutions.com:8443/prweb/api/Users/v1/CreatePatient',
            {
              method: 'POST',
              body: JSON.stringify(data)
            }
          );

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(`API responded with ${response.status}: ${errorText || 'No details'}`);
          }

          let result: any;
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const text = await response.text();
            result = text.trim() ? JSON.parse(text) : { success: true };
          } else {
            result = { success: true };
          }

          console.log('Patient data saved successfully:', result);

          return {
            success: true,
            response: result,
            disconnect: true,
            message: `Wonderful! Thank you so much for your patience, ${data.PatientInformation.FirstName}. I've got everything saved in our system now. You're all set for registration. It was really nice talking with you today — have a great rest of your day!`
          };

        } catch (error: any) {
          console.error('Error saving patient data:', error);

          const isNetErr = isNetworkError(error);
          const name = data.PatientInformation?.FirstName || 'there';

          return {
            success: false,
            error: error.message ?? 'Unknown error occurred',
            disconnect: false,
            isNetworkError: isNetErr,
            message: isNetErr
              ? `I'm really sorry, ${name}, but I'm having trouble connecting to our system right now. This might be a temporary network issue — we can try again shortly, or I can have someone call you back to complete the registration.`
              : `I'm really sorry, ${name}, but I'm having a technical issue saving your information right now. We can try again, or I can have someone follow up to complete your registration.`
          };
        }
      }
    })
  ],
  handoffs: []
});
