'use client';

import { useState } from 'react';
import { Crown, Star, Zap, Shield, TrendingUp, Users, HeadphonesIcon } from 'lucide-react';

interface PremiumFeaturesProps {
  onUpgrade?: () => void;
}

export default function PremiumFeatures({ onUpgrade }: PremiumFeaturesProps) {
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | 'enterprise'>('basic');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'Free',
      features: [
        'Single trading bot',
        'Basic technical indicators',
        'Manual trading only',
        '1 stock at a time',
        'Community support',
        'Basic analytics'
      ],
      limitations: [
        'No real-time alerts',
        'Limited backtesting',
        'No advanced strategies'
      ],
      color: 'from-slate-600 to-slate-700'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹499/month',
      features: [
        'Multiple trading bots',
        'Grid trading strategy',
        'Advanced indicators (RSI, MACD, Bollinger)',
        'Real-time price alerts',
        'Unlimited stocks',
        'Backtesting engine',
        'Performance analytics',
        'Priority support',
        'API access',
        'Custom strategies'
      ],
      limitations: [],
      color: 'from-blue-600 to-purple-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹1,999/month',
      features: [
        'Everything in Pro',
        'Unlimited bots',
        'AI-powered strategies',
        'Institutional data feeds',
        'Dedicated account manager',
        'Custom integrations',
        'White-label options',
        'Advanced risk management',
        'Phone support',
        'On-premise deployment'
      ],
      limitations: [],
      color: 'from-yellow-600 to-orange-600'
    }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h3 className="text-2xl font-bold text-white">Premium Trading Features</h3>
        </div>
        <p className="text-slate-400">
          Unlock professional trading tools and maximize your profits
        </p>
      </div>

      {/* Plan Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-800 rounded-lg p-1 flex space-x-1">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id as any)}
              className={`px-4 py-2 rounded-md transition-all ${
                selectedPlan === plan.id
                  ? `bg-gradient-to-r ${plan.color} text-white`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {plan.name}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Details */}
      <div className="max-w-2xl mx-auto">
        {currentPlan && (
          <div className={`bg-gradient-to-br ${currentPlan.color} p-1 rounded-xl`}>
            <div className="bg-slate-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xl font-bold text-white">{currentPlan.name}</h4>
                    {currentPlan.popular && (
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full font-medium">
                        MOST POPULAR
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-white mt-1">{currentPlan.price}</div>
                </div>
                <div className="text-right">
                  {currentPlan.id === 'pro' && (
                    <div className="text-green-400 text-sm">Save 20% vs Enterprise</div>
                  )}
                  {currentPlan.id === 'enterprise' && (
                    <div className="text-yellow-400 text-sm">Best Value</div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-slate-300">What's Included:</h5>
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}

                {/* Limitations */}
                {currentPlan.limitations.length > 0 && (
                  <>
                    <h5 className="text-sm font-medium text-slate-300 mt-4">Limitations:</h5>
                    {currentPlan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center">
                          <div className="w-2 h-0.5 bg-slate-400"></div>
                        </div>
                        <span className="text-slate-400">{limitation}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* CTA Button */}
              <div className="mt-6">
                {selectedPlan === 'basic' ? (
                  <button
                    onClick={() => setSelectedPlan('pro')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-105"
                  >
                    Upgrade to Pro - ₹499/month
                  </button>
                ) : (
                  <button
                    onClick={onUpgrade}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-105"
                  >
                    Get Started with {currentPlan.name}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Value Proposition */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <h5 className="text-white font-medium mb-1">Higher Returns</h5>
          <p className="text-slate-400 text-sm">Advanced strategies for better performance</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <h5 className="text-white font-medium mb-1">Risk Management</h5>
          <p className="text-slate-400 text-sm">Professional tools to protect your capital</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 text-center">
          <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <h5 className="text-white font-medium mb-1">Expert Support</h5>
          <p className="text-slate-400 text-sm">Get help from trading professionals</p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="mt-8 bg-slate-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">What Traders Say</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 rounded p-4">
            <div className="flex items-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <p className="text-slate-300 text-sm mb-2">
              "The grid trading bot helped me generate consistent returns even in volatile markets. Worth every penny!"
            </p>
            <div className="text-slate-500 text-xs">- Raj K., Mumbai</div>
          </div>
          <div className="bg-slate-900 rounded p-4">
            <div className="flex items-center space-x-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <p className="text-slate-300 text-sm mb-2">
              "Backtesting feature saved me from potential losses. Professional tools at affordable price."
            </p>
            <div className="text-slate-500 text-xs">- Priya S., Bangalore</div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-8 text-center">
        <h4 className="text-lg font-semibold text-white mb-4">Frequently Asked Questions</h4>
        <div className="space-y-3 text-left max-w-2xl mx-auto">
          <details className="bg-slate-800 rounded p-4">
            <summary className="text-white font-medium cursor-pointer">Is there a free trial?</summary>
            <p className="text-slate-400 text-sm mt-2">
              Yes! We offer 7-day free trial for Pro plan with all features included.
            </p>
          </details>
          <details className="bg-slate-800 rounded p-4">
            <summary className="text-white font-medium cursor-pointer">Can I cancel anytime?</summary>
            <p className="text-slate-400 text-sm mt-2">
              Absolutely. No long-term commitments. Cancel your subscription anytime.
            </p>
          </details>
          <details className="bg-slate-800 rounded p-4">
            <summary className="text-white font-medium cursor-pointer">Do you guarantee profits?</summary>
            <p className="text-slate-400 text-sm mt-2">
              No. Trading involves risk. Our tools improve your chances but don't guarantee profits.
            </p>
          </details>
        </div>
      </div>

      {/* Contact Support */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <HeadphonesIcon className="w-5 h-5" />
          <span>Need help? Contact our support team at support@stocket.in</span>
        </div>
      </div>
    </div>
  );
}
