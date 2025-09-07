import React, { useState } from 'react';
import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { useFacebookData } from '@/hooks/useFacebookData';
import { useCampaigns } from '@/hooks/useCampaigns';
import { 
  LogOut, 
  User, 
  Facebook, 
  UserCheck, 
  BarChart3, 
  DollarSign, 
  Eye, 
  MousePointer,
  TrendingUp,
  RefreshCw,
  Activity,
  Calendar
} from 'lucide-react';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const isGuest = user?.isGuest || false;
  const { fbUser, pages, isLoadingPages } = useFacebookData();
  
  // Calculate default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };
  
  // Date range state with default values
  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  
  const { 
    campaigns, 
    summary, 
    isLoadingCampaigns, 
    isLoadingSummary, 
    refreshCampaigns, 
    isRefreshing,
    campaignsError,
    updateFilters,
    currentFilters
  } = useCampaigns({
    startDate,
    endDate
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL').format(num);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color, 
    loading = false 
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    loading?: boolean;
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg fade-in-up">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="mr-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate hebrew-text">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900">
                {loading ? (
                  <div className="h-6 bg-gray-200 rounded shimmer"></div>
                ) : (
                  value
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  const CampaignRow = ({ campaign }: { campaign: any }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hebrew-text">
        {campaign.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          campaign.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : campaign.status === 'paused'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {campaign.status === 'active' ? 'פעיל' : campaign.status === 'paused' ? 'מושהה' : 'לא פעיל'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 ltr">
        {formatCurrency(campaign.performance_metrics?.spend || 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatNumber(campaign.performance_metrics?.impressions || 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatNumber(campaign.performance_metrics?.clicks || 0)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {(campaign.performance_metrics?.ctr || 0).toFixed(2)}%
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {(campaign.performance_metrics?.roas || 0).toFixed(2)}
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-100 hebrew-text">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold hebrew-text">לוח בקרה</h1>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <span className="text-gray-700 hebrew-text">{user?.name}</span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 ml-2" />
                התנתקות
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Guest User Message */}
          {isGuest && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg mb-6 p-6 fade-in-up">
              <div className="flex">
                <div className="flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-yellow-800 hebrew-text">
                    גישה מוגבלת כאורח
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 hebrew-text">
                    <p>
                      אתה נמצא כעת במצב אורח בסנאפיקס. כדי לגשת לתכונות אינטגרציית פייסבוק,
                      ניהול דפים וזרמי עבודה אוטומטיים, אנא התחבר עם חשבון הפייסבוק שלך.
                    </p>
                    <a
                      href="/login"
                      className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      התחבר עם פייסבוק
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Stats Grid */}
          {!isGuest && (
            <>
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 hebrew-text">סטטיסטיקות קמפיינים</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    {/* Date Range Picker */}
                    <div className="flex items-center gap-2 bg-white border rounded-lg p-2 shadow-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          updateFilters({ startDate: e.target.value });
                        }}
                        className="text-sm border-0 focus:ring-0 focus:outline-none bg-transparent"
                        max={endDate || undefined}
                      />
                      <span className="text-gray-400 text-sm">עד</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          updateFilters({ endDate: e.target.value });
                        }}
                        className="text-sm border-0 focus:ring-0 focus:outline-none bg-transparent"
                        min={startDate || undefined}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    
                    {/* Refresh Button */}
                    <button
                      onClick={() => refreshCampaigns()}
                      disabled={isRefreshing}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      רענון נתונים
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard
                    title="סה״כ הוצאה"
                    value={formatCurrency((summary as any)?.total_spend || 0)}
                    icon={DollarSign}
                    color="text-green-600"
                    loading={isLoadingSummary}
                  />
                  <StatCard
                    title="סה״כ הופעות"
                    value={formatNumber((summary as any)?.total_impressions || 0)}
                    icon={Eye}
                    color="text-blue-600"
                    loading={isLoadingSummary}
                  />
                  <StatCard
                    title="סה״כ לחיצות"
                    value={formatNumber((summary as any)?.total_clicks || 0)}
                    icon={MousePointer}
                    color="text-purple-600"
                    loading={isLoadingSummary}
                  />
                  <StatCard
                    title="קמפיינים פעילים"
                    value={(summary as any)?.active_campaigns || 0}
                    icon={Activity}
                    color="text-orange-600"
                    loading={isLoadingSummary}
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <StatCard
                  title="ממוצע CTR"
                  value={`${(summary?.avg_ctr || 0).toFixed(2)}%`}
                  icon={TrendingUp}
                  color="text-indigo-600"
                  loading={isLoadingSummary}
                />
                <StatCard
                  title="ממוצע ROAS"
                  value={(summary?.avg_roas || 0).toFixed(2)}
                  icon={BarChart3}
                  color="text-emerald-600"
                  loading={isLoadingSummary}
                />
                <StatCard
                  title="סה״כ קמפיינים"
                  value={(summary as any)?.total_campaigns || 0}
                  icon={Activity}
                  color="text-rose-600"
                  loading={isLoadingSummary}
                />
              </div>

              {/* Campaigns Table */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md fade-in-up">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 hebrew-text">
                    קמפיינים אחרונים
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500 hebrew-text">
                    רשימת הקמפיינים הפעילים והמושהים שלך
                  </p>
                </div>
                <div className="overflow-x-auto">
                  {isLoadingCampaigns ? (
                    <div className="p-6">
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-12 bg-gray-200 rounded shimmer"></div>
                        ))}
                      </div>
                    </div>
                  ) : campaignsError ? (
                    <div className="p-6 text-center">
                      <p className="text-red-600 hebrew-text">שגיאה בטעינת הקמפיינים: {campaignsError.message}</p>
                    </div>
                  ) : (campaigns as any[])?.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hebrew-text">
                            שם קמפיין
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hebrew-text">
                            סטטוס
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hebrew-text">
                            הוצאה
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hebrew-text">
                            הופעות
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hebrew-text">
                            לחיצות
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CTR
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ROAS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(campaigns as any[])?.slice(0, 10).map((campaign: any) => (
                          <CampaignRow key={campaign.id} campaign={campaign} />
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-gray-500 hebrew-text">לא נמצאו קמפיינים. התחבר לחשבון הפייסבוק שלך כדי להתחיל.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* User Info and Facebook Connection - Show for both guest and authenticated users */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg fade-in-up">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-gray-400" />
                  <div className="mr-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 hebrew-text">
                      מידע משתמש
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 hebrew-text">
                      <p>שם: {user?.name}</p>
                      <p>אימייל: {user?.email}</p>
                      <p>סוג גישה: {isGuest ? 'אורח' : 'רשום'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facebook Data Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg fade-in-up">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  {isGuest ? (
                    <UserCheck className="h-8 w-8 text-gray-400" />
                  ) : (
                    <Facebook className="h-8 w-8 text-blue-600" />
                  )}
                  <div className="mr-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 hebrew-text">
                      {isGuest ? 'גישה כאורח' : 'חיבור פייסבוק'}
                    </h3>
                    <div className="mt-2 text-sm text-gray-500 hebrew-text">
                      {isGuest ? (
                        <p>התחבר עם פייסבוק לתכונות מלאות</p>
                      ) : fbUser ? (
                        <p>מחובר בתור: {fbUser.name}</p>
                      ) : (
                        <p>טוען נתוני פייסבוק...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pages List - Only show for non-guest users */}
          {!isGuest && pages && pages.data && (
            <div className="bg-white overflow-hidden shadow rounded-lg mt-6 fade-in-up">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 hebrew-text">
                  דפי הפייסבוק שלך
                </h3>
                {isLoadingPages ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-200 rounded shimmer"></div>
                    ))}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pages.data.map((page: any) => (
                      <li key={page.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 hebrew-text">
                            {page.name}
                          </span>
                          <span className="text-sm text-gray-500 hebrew-text">
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
        </div>
      </main>
    </div>
  );
}