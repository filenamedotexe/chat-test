'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Global Error</h2>
            <p className="text-gray-300 mb-4">A critical error occurred.</p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="bg-gray-900 p-4 rounded text-xs text-gray-400 overflow-auto mb-4">
                {error.message}
              </pre>
            )}
            <button
              onClick={reset}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md"
            >
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}