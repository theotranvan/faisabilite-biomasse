'use client';

export function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      {/* Animated logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-green-200/40 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center shadow-lg">
          <img src="/logo-combiosol.jpg" alt="" className="h-14 w-14 object-contain rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 rounded-full animate-loading-bar" />
      </div>

      {/* Text */}
      <p className="text-sm font-medium text-gray-500 tracking-wide">{message}</p>

      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function LoadingFullPage({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <LoadingScreen message={message} />
    </div>
  );
}
