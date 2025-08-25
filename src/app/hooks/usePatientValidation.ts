import { useState } from 'react';
import { validateField } from '../validation/patientValidation';

export const usePatientValidation = () => {
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateFieldRealTime = (fieldName: string, value: string) => {
    const result = validateField(fieldName, value);
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.isValid ? null : result.error || null
    }));
    return result.isValid;
  };

  const clearErrors = () => setErrors({});

  return { errors, validateFieldRealTime, clearErrors };
};
