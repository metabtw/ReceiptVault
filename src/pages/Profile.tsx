import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePremium } from '../hooks/usePremium';
import { Card } from '../components/ui/Card';
import { ArrowLeft, User, LogOut, Settings, Globe, Moon, CreditCard, Check } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { plan } = usePremium();
  
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('System');

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.email?.[0].toUpperCase() || <User />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.email}</h2>
            <p className="text-gray-500 capitalize">{plan} Plan</p>
          </div>
        </div>

        {/* Pricing / Plans */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-500" />
            Subscription Plan
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Free Plan */}
            <Card className={`p-5 border-2 ${plan === 'free' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900">Free</h4>
                {plan === 'free' && <Check className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="text-2xl font-bold mb-4">$0<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• 10 receipts/month</li>
                <li>• Basic AI extraction</li>
                <li>• 1 device</li>
              </ul>
              {plan !== 'free' && (
                <button className="w-full py-2 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100">
                  Downgrade
                </button>
              )}
            </Card>

            {/* Premium Plan */}
            <Card className={`p-5 border-2 ${plan === 'pro' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900">Premium</h4>
                {plan === 'pro' && <Check className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="text-2xl font-bold mb-4">$4.99<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• Unlimited receipts</li>
                <li>• Advanced AI & Warranty tracking</li>
                <li>• Export to CSV</li>
              </ul>
              {plan !== 'pro' && (
                <button className="w-full py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700">
                  Upgrade
                </button>
              )}
            </Card>

            {/* Family Plan */}
            <Card className={`p-5 border-2 ${plan === 'family' ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-gray-900">Family</h4>
                {plan === 'family' && <Check className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="text-2xl font-bold mb-4">$9.99<span className="text-sm text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li>• Everything in Premium</li>
                <li>• Share with up to 5 members</li>
                <li>• Shared vaults</li>
              </ul>
              {plan !== 'family' && (
                <button className="w-full py-2 rounded-lg font-medium text-blue-600 bg-blue-50 hover:bg-blue-100">
                  Upgrade
                </button>
              )}
            </Card>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Preferences
          </h3>
          <Card className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Language</span>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option>English</option>
                <option>Türkçe</option>
                <option>Español</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">Theme</span>
              </div>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option>System</option>
                <option>Light</option>
                <option>Dark</option>
              </select>
            </div>
          </Card>
        </section>

        {/* Actions */}
        <section className="pt-4">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </section>
      </main>
    </div>
  );
}
