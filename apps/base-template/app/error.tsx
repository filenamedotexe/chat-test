'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
        <p className="text-gray-300 mb-4">An error occurred while processing your request.</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="bg-gray-900 p-4 rounded text-xs text-gray-400 overflow-auto mb-4">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  );
}