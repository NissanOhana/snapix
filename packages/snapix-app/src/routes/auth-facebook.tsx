import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useFacebookAuth, type FacebookAdAccount } from '@/hooks/useFacebookAuth';
import { useAuth } from '@/hooks/useAuth';

interface AdAccountSelectionProps {
  adAccounts: FacebookAdAccount[];
  onSelect: (accountId: string) => void;
  isSelecting: boolean;
}

function AdAccountSelection({ adAccounts, onSelect, isSelecting }: AdAccountSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">בחר חשבון פרסום</h1>
            <p className="text-gray-600">בחר את חשבון הפרסום בפייסבוק שברצונך לחבר</p>
          </div>

          <div className="space-y-4">
            {adAccounts.map((account) => (
              <div 
                key={account.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => !isSelecting && onSelect(account.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{account.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>ID: {account.account_id}</span>
                      <span>מטבע: {account.currency}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        account.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isSelecting && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                </svg>
                מחבר חשבון...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthFacebookPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { handleOAuthCode, selectAdAccount, isProcessingAuth } = useFacebookAuth();
  
  const [step, setStep] = useState<'processing' | 'select-account' | 'completed' | 'error'>('processing');
  const [adAccounts, setAdAccounts] = useState<FacebookAdAccount[]>([]);
  const [tempAccessToken, setTempAccessToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate({ to: '/login' });
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError('פייסבוק דחה את הבקשה לחיבור');
      setStep('error');
      return;
    }

    if (!code) {
      setError('לא התקבל קוד אישור מפייסבוק');
      setStep('error');
      return;
    }

    // Step 1: Handle OAuth code
    handleOAuthCode(code)
      .then((result) => {
        if (result.requiresAccountSelection && result.adAccounts) {
          setAdAccounts(result.adAccounts);
          setTempAccessToken(result._tempAccessToken || '');
          setStep('select-account');
        } else {
          setStep('completed');
          // Redirect to dashboard or previous page
          const redirectUrl = localStorage.getItem('authRedirect') || '/dashboard';
          localStorage.removeItem('authRedirect');
          navigate({ to: redirectUrl });
        }
      })
      .catch((error) => {
        console.error('OAuth error:', error);
        setError(error.message || 'שגיאה בחיבור לפייסבוק');
        setStep('error');
      });
  }, [isAuthenticated, navigate, handleOAuthCode]);

  const handleAccountSelection = async (accountId: string) => {
    try {
      await selectAdAccount(accountId, tempAccessToken);
      setStep('completed');
      
      // Success! Redirect to dashboard
      const redirectUrl = localStorage.getItem('authRedirect') || '/dashboard';
      localStorage.removeItem('authRedirect');
      navigate({ to: redirectUrl });
    } catch (error: any) {
      console.error('Account selection error:', error);
      setError(error.message || 'שגיאה בחיבור החשבון');
      setStep('error');
    }
  };

  // Loading state
  if (step === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="animate-spin w-full h-full text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
              <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">מחבר לפייסבוק...</h2>
          <p className="text-gray-600">אנא המתן בזמן שאנו מחברים את החשבון שלך</p>
        </div>
      </div>
    );
  }

  // Account selection step
  if (step === 'select-account') {
    return (
      <AdAccountSelection 
        adAccounts={adAccounts}
        onSelect={handleAccountSelection}
        isSelecting={isProcessingAuth}
      />
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">שגיאה בחיבור</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              חזור לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Completed state (should redirect, but just in case)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">החיבור הושלם בהצלחה!</h2>
        <p className="text-gray-600">מעביר אותך לדף הבית...</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/auth-facebook')({
  component: AuthFacebookPage,
});