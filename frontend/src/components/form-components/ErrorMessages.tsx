import React from 'react';

type ErrorMessage = string | { message: string };

interface ErrorMessagesProps {
  errors: ErrorMessage[];
}

export function ErrorMessages({ errors }: ErrorMessagesProps) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === 'string' ? error : error.message}
          className="text-red-500 mt-1 font-bold"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  );
}
