import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { useFacebookData } from '@/hooks/useFacebookData';
import { LogOut, User, Facebook, UserCheck } from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const isGuest = user?.isGuest || false;
  const { fbUser, pages, isLoadingPages } = useFacebookData();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.name}</span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-gray-400" />
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      User Information
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Name: {user?.name}</p>
                      <p>Email: {user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facebook Data Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  {isGuest ? (
                    <UserCheck className="h-8 w-8 text-gray-400" />
                  ) : (
                    <Facebook className="h-8 w-8 text-blue-600" />
                  )}
                  <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isGuest ? 'Guest Access' : 'Facebook Connection'}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500">
                      {isGuest ? (
                        <p>Sign in with Facebook for full features</p>
                      ) : fbUser ? (
                        <p>Connected as: {fbUser.name}</p>
                      ) : (
                        <p>Loading Facebook data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pages List - Only show for non-guest users */}
            {!isGuest && pages && pages.data && (
              <div className="bg-white overflow-hidden shadow rounded-lg md:col-span-2">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Your Facebook Pages
                  </h3>
                  {isLoadingPages ? (
                    <p>Loading pages...</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {pages.data.map((page: any) => (
                        <li key={page.id} className="py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">
                              {page.name}
                            </span>
                            <span className="text-sm text-gray-500">
                              {page.category}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            
            {/* Guest User Message */}
            {isGuest && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:col-span-2 p-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <UserCheck className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Limited Guest Access
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You're currently using Snapix as a guest. To access Facebook integration features,
                        page management, and automation workflows, please sign in with your Facebook account.
                      </p>
                      <a
                        href="/login"
                        className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Sign in with Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}