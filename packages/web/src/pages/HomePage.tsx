import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Title */}
        <div className="text-center animate-fade-in">
          <h1 className="text-5xl font-bold text-primary-600 mb-2">EatOut</h1>
          <p className="text-lg text-slate-600">
            Decide where to eat by eliminating what you don't want
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4 animate-slide-up">
          {/* Create Session */}
          <button
            onClick={() => navigate('/create')}
            className="w-full card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-xl font-semibold text-slate-900">
                  Start New Session
                </h2>
                <p className="text-sm text-slate-600">
                  Create a group and share the link
                </p>
              </div>
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>

          {/* Join Session */}
          <button
            onClick={() => navigate('/join')}
            className="w-full card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center group-hover:bg-secondary-200 transition-colors">
                <svg
                  className="w-6 h-6 text-secondary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h2 className="text-xl font-semibold text-slate-900">
                  Join Session
                </h2>
                <p className="text-sm text-slate-600">
                  Enter a code to join a group
                </p>
              </div>
              <svg
                className="w-5 h-5 text-slate-400 group-hover:text-secondary-600 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 pt-4">
          <p>No accounts required. Share a link and start deciding!</p>
        </div>
      </div>
    </div>
  );
}
