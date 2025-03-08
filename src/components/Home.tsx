import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Calculator, ExternalLink, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatValue } from '../utils/formatValue';
import { supabase } from '../lib/supabase';
import { Item, ItemHistory } from '../types/database';
import { Link } from 'react-router-dom';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'value'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedItemHistory, setSelectedItemHistory] = useState<ItemHistory[]>([]);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{id: string, quantity: number}[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      loadItemHistory(selectedItem.id);
    }
  }, [selectedItem]);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading items:', error);
      return;
    }

    setItems(data || []);
    setIsLoading(false);
  };

  const loadItemHistory = async (itemId: string) => {
    const { data, error } = await supabase
      .from('item_history')
      .select('*')
      .eq('item_id', itemId)
      .order('date');

    if (error) {
      console.error('Error loading item history:', error);
      return;
    }

    setSelectedItemHistory(data || []);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-5 w-5 text-primary" />;
      case 'falling':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      default:
        return <Minus className="h-5 w-5 text-gray-400" />;
    }
  };

  const filteredItems = items
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc' 
          ? a.current_value - b.current_value 
          : b.current_value - a.current_value;
      }
    });

  const calculateTotal = () => {
    return selectedItems.reduce((total, selected) => {
      const item = items.find(i => i.id === selected.id);
      if (item) {
        return total + (item.current_value * selected.quantity);
      }
      return total;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 animate-pulse-custom">
          <div className="h-12 w-12 bg-primary/50 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-jetbrains font-bold">
                <span className="text-accent">BGSI</span>
                <span className="text-secondary">.XYZ</span>
              </span>
            </div>

            <div className="flex items-center space-x-8">
              <button 
                onClick={() => setIsCalculatorOpen(true)}
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <Calculator className="h-5 w-5" />
                Calculator
              </button>
              <Link
                to="/admin"
                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <Lock className="h-5 w-5" />
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input pl-10"
                />
              </div>
            </div>
          </div>

          {/* Value List */}
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="table-header">Item</th>
                  <th className="table-header">Current Value</th>
                  <th className="table-header">Trend</th>
                  <th className="table-header">Change</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image_url}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="stat-value text-primary">{formatValue(item.current_value)}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`value-tag ${item.trend}`}>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(item.trend)}
                          {item.trend.charAt(0).toUpperCase() + item.trend.slice(1)}
                        </div>
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-medium ${
                        item.change.startsWith('+') ? 'text-primary' :
                        item.change.startsWith('-') ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {item.change}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button 
                        className="btn-secondary flex items-center gap-1 text-sm py-1.5"
                        onClick={() => setSelectedItem(item)}
                      >
                        Details
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border border-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="stat-value text-primary">{formatValue(selectedItem.current_value)}</span>
                    <span className={`value-tag ${selectedItem.trend}`}>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(selectedItem.trend)}
                        {selectedItem.change}
                      </div>
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Minus className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Value History</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={selectedItemHistory}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(111, 76, 255)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="rgb(111, 76, 255)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#6B7280"
                      tick={{ fill: '#9CA3AF' }}
                    />
                    <YAxis 
                      stroke="#6B7280"
                      tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(value) => formatValue(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(17, 24, 39)',
                        border: '1px solid rgb(31, 41, 55)',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value: number) => [formatValue(value), 'Value']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="rgb(111, 76, 255)" 
                      fillOpacity={1}
                      fill="url(#valueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Additional Fields */}
            {Object.entries(selectedItem.additional_fields).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <div className="grid gap-4">
                  {Object.entries(selectedItem.additional_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-4 bg-gray-800/30 rounded-lg">
                      <span className="font-medium capitalize">{key}</span>
                      <span className="text-gray-300">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background border border-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calculator className="h-6 w-6" />
                Value Calculator
              </h2>
              <button 
                onClick={() => setIsCalculatorOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <Minus className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {items.map(item => {
                const selectedItem = selectedItems.find(si => si.id === item.id);
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-400">{formatValue(item.current_value)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={selectedItem?.quantity || 0}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 0;
                          if (quantity === 0) {
                            setSelectedItems(selectedItems.filter(si => si.id !== item.id));
                          } else {
                            const newSelectedItems = selectedItems.filter(si => si.id !== item.id);
                            newSelectedItems.push({ id: item.id, quantity });
                            setSelectedItems(newSelectedItems);
                          }
                        }}
                        className="w-20 px-3 py-1 bg-gray-700 border border-gray-600 rounded-lg text-center"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total Value:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatValue(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <span className="text-xl font-jetbrains font-bold">
                <span className="text-accent">BGSI</span>
                <span className="text-secondary">.XYZ</span>
              </span>
            </div>
            <div className="flex gap-6">
              <a href="https://discord.gg/FDSk2zmxtX" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Discord</a>
              <a href="https://x.com/RobloxBGSI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
            </div>
            <div className="text-gray-500 text-sm">
              © 2025 BGSI.XYZ
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}