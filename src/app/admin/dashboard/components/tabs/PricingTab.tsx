// app/admin/pricing/page.tsx
"use client";

import React, { useState, useEffect } from "react";

interface Feature {
  name: string;
  included: boolean;
  description?: string;
}

interface PricingPlan {
  _id?: string;
  name: string;
  description: string;
  monthlyUSD?: number;
  annualUSD?: number;
  monthlyINR?: number;
  annualINR?: number;

  maxAuditsPerMonth?: number;
  maxKeywordReportsPerMonth?: number;
  maxBusinessNamesPerMonth?: number;
  maxKeywordChecksPerMonth?: number;
  maxKeywordScrapesPerMonth?: number;
  highlight?: boolean;
  custom?: boolean;
  features: Feature[];
  isActive?: boolean;
  sortOrder?: number;
  includesTax?: boolean;
  isFree?: boolean;
}

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'INR'>('USD');

  const [newPlan, setNewPlan] = useState<Omit<PricingPlan, '_id'>>({
    name: "",
    description: "",
    monthlyUSD: undefined,
    annualUSD: undefined,
    monthlyINR: undefined,
    annualINR: undefined,

    maxAuditsPerMonth: undefined,
    maxKeywordReportsPerMonth: undefined,
    maxBusinessNamesPerMonth: undefined,
    maxKeywordChecksPerMonth: undefined,
    maxKeywordScrapesPerMonth: undefined,
    highlight: false,
    custom: false,
    features: [{ name: "", included: true }],
    isActive: true,
    sortOrder: 0,
    includesTax: false,
    isFree: false,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE}/api/admin/pricing`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        throw new Error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      setMessage({ type: 'error', text: 'Failed to load pricing plans' });
    } finally {
      setLoading(false);
    }
  };

  const savePlans = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE}/api/admin/pricing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plans }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Pricing plans updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to save plans");
      }
    } catch (error) {
      console.error("Error saving plans:", error);
      setMessage({ type: 'error', text: 'Failed to save pricing plans' });
    } finally {
      setSaving(false);
    }
  };

  const addNewPlan = () => {
    if (!newPlan.name.trim()) return;
    
    const plan: PricingPlan = {
      ...newPlan,
      monthlyUSD: newPlan.isFree ? 0 : newPlan.monthlyUSD,
      annualUSD: newPlan.isFree ? 0 : newPlan.annualUSD,
      monthlyINR: newPlan.isFree ? 0 : newPlan.monthlyINR,
      annualINR: newPlan.isFree ? 0 : newPlan.annualINR,

      features: newPlan.features.filter(f => f.name.trim() !== ""),
    };

    setPlans(prevPlans => [...prevPlans, plan]);
    setNewPlan({
      name: "",
      description: "",
      monthlyUSD: undefined,
      annualUSD: undefined,
      monthlyINR: undefined,
      annualINR: undefined,

      maxAuditsPerMonth: undefined,
      maxKeywordReportsPerMonth: undefined,
      maxBusinessNamesPerMonth: undefined,
      maxKeywordChecksPerMonth: undefined,
      maxKeywordScrapesPerMonth: undefined,
      highlight: false,
      custom: false,
      features: [{ name: "", included: true }],
      isActive: true,
      sortOrder: prevPlans.length,
      includesTax: false,
      isFree: false,
    });
  };

  const updatePlan = (index: number, field: keyof PricingPlan, value: any) => {
    setPlans(prevPlans => {
      const updatedPlans = [...prevPlans];
      
      // If setting isFree to true, automatically set prices to 0
      if (field === 'isFree' && value === true) {
        updatedPlans[index] = { 
          ...updatedPlans[index], 
          [field]: value,
          monthlyUSD: 0,
          annualUSD: 0,
          monthlyINR: 0,
          annualINR: 0,

          custom: false
        };
      } else {
        updatedPlans[index] = { ...updatedPlans[index], [field]: value };
      }
      
      return updatedPlans;
    });
  };

  const updatePlanFeature = (planIndex: number, featureIndex: number, field: keyof Feature, value: any) => {
    setPlans(prevPlans => {
      const updatedPlans = [...prevPlans];
      const updatedFeatures = [...updatedPlans[planIndex].features];
      updatedFeatures[featureIndex] = { ...updatedFeatures[featureIndex], [field]: value };
      updatedPlans[planIndex] = { ...updatedPlans[planIndex], features: updatedFeatures };
      return updatedPlans;
    });
  };

  const addFeatureToPlan = (planIndex: number) => {
    setPlans(prevPlans => {
      const updatedPlans = [...prevPlans];
      updatedPlans[planIndex] = {
        ...updatedPlans[planIndex],
        features: [...updatedPlans[planIndex].features, { name: "", included: true }]
      };
      return updatedPlans;
    });
  };

  const removeFeatureFromPlan = (planIndex: number, featureIndex: number) => {
    setPlans(prevPlans => {
      const updatedPlans = [...prevPlans];
      const planFeatures = updatedPlans[planIndex].features;
      
      const featuresAfterRemoval = planFeatures.filter((_, index) => index !== featureIndex);
      
      if (featuresAfterRemoval.length === 0) {
        updatedPlans[planIndex] = {
          ...updatedPlans[planIndex],
          features: [{ name: "", included: true }]
        };
      } else {
        updatedPlans[planIndex] = {
          ...updatedPlans[planIndex],
          features: featuresAfterRemoval
        };
      }
      
      return updatedPlans;
    });
  };

  const removePlan = async (index: number, planId?: string) => {
    if (planId) {
      // This is an existing plan from the database, call API to delete
      try {
        const token = localStorage.getItem("adminToken");
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        
        const response = await fetch(`${API_BASE}/api/admin/pricing/${planId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setPlans(prevPlans => prevPlans.filter((_, i) => i !== index));
          setMessage({ type: 'success', text: 'Plan deleted successfully!' });
          setTimeout(() => setMessage(null), 3000);
        } else {
          throw new Error("Failed to delete plan");
        }
      } catch (error) {
        console.error("Error deleting plan:", error);
        setMessage({ type: 'error', text: 'Failed to delete plan' });
      }
    } else {
      // This is a newly added plan that hasn't been saved to database yet
      setPlans(prevPlans => prevPlans.filter((_, i) => i !== index));
    }
  };

  const addNewFeatureToNewPlan = () => {
    setNewPlan(prev => ({
      ...prev,
      features: [...prev.features, { name: "", included: true }]
    }));
  };

  const updateNewPlanFeature = (featureIndex: number, field: keyof Feature, value: any) => {
    setNewPlan(prev => {
      const updatedFeatures = [...prev.features];
      updatedFeatures[featureIndex] = { ...updatedFeatures[featureIndex], [field]: value };
      return { ...prev, features: updatedFeatures };
    });
  };

  const removeNewPlanFeature = (featureIndex: number) => {
    setNewPlan(prev => {
      const updatedFeatures = prev.features.filter((_, index) => index !== featureIndex);
      
      if (updatedFeatures.length === 0) {
        return { ...prev, features: [{ name: "", included: true }] };
      }
      return { ...prev, features: updatedFeatures };
    });
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const response = await fetch(`${API_BASE}/api/admin/pricing/${planId}/toggle-status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setPlans(prevPlans => 
          prevPlans.map(plan => 
            plan._id === planId ? { ...plan, isActive: !currentStatus } : plan
          )
        );
        setMessage({ type: 'success', text: `Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error("Failed to toggle plan status");
      }
    } catch (error) {
      console.error("Error toggling plan status:", error);
      setMessage({ type: 'error', text: 'Failed to update plan status' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading pricing plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Pricing Plans</h1>
            <p className="text-gray-600">
              Configure and manage your subscription plans dynamically
            </p>
          </div>
          
          {/* Currency Toggle */}
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setCurrencyMode('USD')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                currencyMode === 'USD' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              USD Pricing
            </button>
            <button
              onClick={() => setCurrencyMode('INR')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                currencyMode === 'INR' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              INR Pricing
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add New Plan */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input
                type="text"
                placeholder="e.g., Starter, Professional"
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                placeholder="Plan description"
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Conditional Price Inputs based on Currency Mode */}
            {currencyMode === 'USD' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price ($)</label>
                  <input
                    type="number"
                    placeholder="29"
                    value={newPlan.monthlyUSD || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, monthlyUSD: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={newPlan.isFree}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price ($)</label>
                  <input
                    type="number"
                    placeholder="290"
                    value={newPlan.annualUSD || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, annualUSD: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={newPlan.isFree}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Price (₹)</label>
                  <input
                    type="number"
                    placeholder="2400"
                    value={newPlan.monthlyINR || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, monthlyINR: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-orange-50"
                    disabled={newPlan.isFree}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Price (₹)</label>
                  <input
                    type="number"
                    placeholder="24000"
                    value={newPlan.annualINR || ""}
                    onChange={(e) => setNewPlan({ ...newPlan, annualINR: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-orange-50"
                    disabled={newPlan.isFree}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Audits/Month</label>
              <input
                type="number"
                placeholder="50"
                value={newPlan.maxAuditsPerMonth || ""}
                onChange={(e) => setNewPlan({ ...newPlan, maxAuditsPerMonth: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Keyword Reports</label>
              <input
                type="number"
                placeholder="100"
                value={newPlan.maxKeywordReportsPerMonth || ""}
                onChange={(e) => setNewPlan({ ...newPlan, maxKeywordReportsPerMonth: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Business Names</label>
              <input
                type="number"
                placeholder="50"
                value={newPlan.maxBusinessNamesPerMonth || ""}
                onChange={(e) => setNewPlan({ ...newPlan, maxBusinessNamesPerMonth: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Keyword Checks</label>
              <input
                type="number"
                placeholder="200"
                value={newPlan.maxKeywordChecksPerMonth || ""}
                onChange={(e) => setNewPlan({ ...newPlan, maxKeywordChecksPerMonth: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Keyword Scrapes</label>
              <input
                type="number"
                placeholder="50"
                value={newPlan.maxKeywordScrapesPerMonth || ""}
                onChange={(e) => setNewPlan({ ...newPlan, maxKeywordScrapesPerMonth: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* New Plan Features */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
            <div className="space-y-2">
              {newPlan.features.map((feature, featureIndex) => (
                <div key={featureIndex} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={feature.name}
                      onChange={(e) => updateNewPlanFeature(featureIndex, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Feature description"
                    />
                  </div>
                  <label className="flex items-center space-x-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={feature.included}
                      onChange={(e) => updateNewPlanFeature(featureIndex, 'included', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Included</span>
                  </label>
                  <button
                    onClick={() => removeNewPlanFeature(featureIndex)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={newPlan.features.length === 1 && feature.name === ""}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addNewFeatureToNewPlan}
              className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
            >
              + Add Feature
            </button>
          </div>

          <div className="flex flex-wrap gap-6 mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newPlan.highlight}
                onChange={(e) => setNewPlan({ ...newPlan, highlight: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Highlight Plan (Most Popular)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newPlan.custom}
                onChange={(e) => setNewPlan({ ...newPlan, custom: e.target.checked, isFree: e.target.checked ? false : newPlan.isFree })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Custom Pricing</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newPlan.isFree}
                onChange={(e) => setNewPlan({ 
                  ...newPlan, 
                  isFree: e.target.checked,
                  monthlyUSD: e.target.checked ? 0 : newPlan.monthlyUSD,
                  annualUSD: e.target.checked ? 0 : newPlan.annualUSD,
                  monthlyINR: e.target.checked ? 0 : newPlan.monthlyINR,
                  annualINR: e.target.checked ? 0 : newPlan.annualINR,
                  custom: e.target.checked ? false : newPlan.custom
                })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Free Plan</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newPlan.includesTax}
                onChange={(e) => setNewPlan({ ...newPlan, includesTax: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Includes Tax</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={addNewPlan}
              disabled={!newPlan.name.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Add New Plan
            </button>
            <div className="text-sm text-gray-500">
              Fill in the plan name and features to add a new pricing plan
            </div>
          </div>
        </div>

        {/* Existing Plans */}
        <div className="space-y-6">
          {plans.map((plan, planIndex) => (
            <div
              key={plan._id || planIndex}
              className={`bg-white border rounded-xl p-6 shadow-sm ${
                plan.highlight ? 'border-yellow-400 border-2' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {plan.highlight && (
                      <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Most Popular
                      </span>
                    )}
                    {plan.custom && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                        Custom Pricing
                      </span>
                    )}
                    {plan.isFree && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        Free Plan
                      </span>
                    )}
                    {plan.includesTax && (
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Includes Tax
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {plan._id && (
                    <button
                      onClick={() => togglePlanStatus(plan._id!, plan.isActive || false)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        plan.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                  )}
                  <button
                    onClick={() => removePlan(planIndex, plan._id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={plan.name}
                    onChange={(e) => updatePlan(planIndex, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={plan.description}
                    onChange={(e) => updatePlan(planIndex, 'description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Conditional Edit Price Inputs */}
                {currencyMode === 'USD' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly USD</label>
                      <input
                        type="number"
                        value={plan.monthlyUSD || ""}
                        onChange={(e) => updatePlan(planIndex, 'monthlyUSD', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={plan.custom || plan.isFree}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual USD</label>
                      <input
                        type="number"
                        value={plan.annualUSD || ""}
                        onChange={(e) => updatePlan(planIndex, 'annualUSD', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={plan.custom || plan.isFree}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly INR</label>
                      <input
                        type="number"
                        value={plan.monthlyINR || ""}
                        onChange={(e) => updatePlan(planIndex, 'monthlyINR', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-orange-50 disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={plan.custom || plan.isFree}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual INR</label>
                      <input
                        type="number"
                        value={plan.annualINR || ""}
                        onChange={(e) => updatePlan(planIndex, 'annualINR', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-orange-50 disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={plan.custom || plan.isFree}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Audits/Month</label>
                  <input
                    type="number"
                    value={plan.maxAuditsPerMonth || ""}
                    onChange={(e) => updatePlan(planIndex, 'maxAuditsPerMonth', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Keyword Reports</label>
                  <input
                    type="number"
                    value={plan.maxKeywordReportsPerMonth || ""}
                    onChange={(e) => updatePlan(planIndex, 'maxKeywordReportsPerMonth', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Business Names</label>
                  <input
                    type="number"
                    value={plan.maxBusinessNamesPerMonth || ""}
                    onChange={(e) => updatePlan(planIndex, 'maxBusinessNamesPerMonth', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Keyword Checks</label>
                  <input
                    type="number"
                    value={plan.maxKeywordChecksPerMonth || ""}
                    onChange={(e) => updatePlan(planIndex, 'maxKeywordChecksPerMonth', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Keyword Scrapes</label>
                  <input
                    type="number"
                    value={plan.maxKeywordScrapesPerMonth || ""}
                    onChange={(e) => updatePlan(planIndex, 'maxKeywordScrapesPerMonth', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={plan.highlight || false}
                      onChange={(e) => updatePlan(planIndex, 'highlight', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Highlight</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={plan.custom || false}
                      onChange={(e) => updatePlan(planIndex, 'custom', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Custom Pricing</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={plan.isFree || false}
                      onChange={(e) => updatePlan(planIndex, 'isFree', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Free Plan</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={plan.includesTax || false}
                      onChange={(e) => updatePlan(planIndex, 'includesTax', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Includes Tax</span>
                  </label>
                </div>
              </div>

              {/* Features */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={feature.name}
                          onChange={(e) => updatePlanFeature(planIndex, featureIndex, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Feature description"
                        />
                      </div>
                      <label className="flex items-center space-x-2 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={feature.included}
                          onChange={(e) => updatePlanFeature(planIndex, featureIndex, 'included', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Included</span>
                      </label>
                      <button
                        onClick={() => removeFeatureFromPlan(planIndex, featureIndex)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={plan.features.length === 1 && feature.name === ""}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addFeatureToPlan(planIndex)}
                  className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                >
                  + Add Feature
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        {plans.length > 0 && (
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={fetchPlans}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Discard Changes
            </button>
            <button
              onClick={savePlans}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving Changes...' : 'Save All Changes'}
            </button>
          </div>
        )}

        {plans.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No pricing plans configured yet</div>
            <div className="text-gray-400 text-sm">
              Add your first pricing plan using the form above
            </div>
          </div>
        )}
      </div>
    </div>
  );
}