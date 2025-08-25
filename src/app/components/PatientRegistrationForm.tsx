import React, { useState } from 'react';
import { usePatientValidation } from '../hooks/usePatientValidation';

const initialForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  ssn: '',
  dob: '',
  zip: '',
  state: '',
};

export default function PatientRegistrationForm() {
  const [formData, setFormData] = useState(initialForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { errors, validateFieldRealTime, clearErrors } = usePatientValidation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) validateFieldRealTime(name, value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateFieldRealTime(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    let valid = true;
    Object.entries(formData).forEach(([field, value]) => {
      if (!validateFieldRealTime(field, value)) valid = false;
    });
    if (valid) {
      // Submit logic here
      alert('Form is valid!');
    }
  };

  return (
    <form className="max-w-lg mx-auto p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      {Object.keys(initialForm).map(field => (
        <div key={field} className="mb-4">
          <label className="block mb-1 font-semibold" htmlFor={field}>{field}</label>
          <input
            className={`w-full p-2 border rounded ${(errors as any)[field] ? 'border-red-500' : 'border-gray-300'}`}
            type="text"
            name={field}
            id={field}
            value={(formData as any)[field]}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="off"
          />
          {(errors as any)[field] && <span className="text-red-500 text-sm">{(errors as any)[field]}</span>}
        </div>
      ))}
      <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">Register</button>
    </form>
  );
}
