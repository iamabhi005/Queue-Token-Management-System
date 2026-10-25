import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  ArrowLeft, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  User,
  Sparkles,
  Menu
} from 'lucide-react';
import { useQueue } from '../context/QueueContext';
import AdminSidebar from '../components/layout/AdminSidebar';
import Badge from '../components/common/Badge';

export default function TokenHistoryPage() {
  const { tokens, services, resetToMockData } = useQueue();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter tokens
  const filteredTokens = tokens.filter(token => {
    const sId = typeof token.serviceId === 'object' && token.serviceId !== null ? (token.serviceId.id || token.serviceId._id) : token.serviceId;
    const sName = token.serviceName || (typeof token.serviceId === 'object' ? token.serviceId?.name : '') || '';
    const cName = token.counterNumber || (typeof token.counterId === 'object' ? token.counterId?.name : '') || '';

    const matchesStatus = statusFilter === 'ALL' || token.status === statusFilter;
    const matchesService = serviceFilter === 'ALL' || sId === serviceFilter;
    const matchesSearch = 
      (token.tokenNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (token.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      sName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesService && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage) || 1;
  const paginatedTokens = filteredTokens.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Client-side CSV export
  const handleExportCSV = () => {
    const headers = ['Token Number', 'Customer Name', 'Phone', 'Service', 'Counter', 'Status', 'Priority', 'Wait Time (mins)', 'Service Time (mins)', 'Created At'];
    const rows = filteredTokens.map(t => [
      `"${t.tokenNumber}"`,
      `"${t.customerName}"`,
      `"${t.phone || 'N/A'}"`,
      `"${t.serviceName}"`,
      `"${t.counterNumber || 'Unassigned'}"`,
      `"${t.status}"`,
      `"${t.priority}"`,
      t.waitMinutes || 0,
      t.serviceMinutes || 0,
      `"${new Date(t.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartqueue_token_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>Token Audit & History Log</span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Detailed record of all generated, served, and skipped customer tokens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-3.5 sm:p-6 lg:p-8 space-y-6 flex-1">
          
          {/* Filters Bar Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search token #, customer, or station..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-white"
                />
              </div>

              {/* Status and Service Dropdowns */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600 cursor-pointer w-full sm:w-auto"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="WAITING">Waiting</option>
                    <option value="SERVING">Serving</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="SKIPPED">Skipped</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Service:</span>
                  <select
                    value={serviceFilter}
                    onChange={(e) => {
                      setServiceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-600 cursor-pointer w-full sm:w-auto"
                  >
                    <option value="ALL">All Services</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {(statusFilter !== 'ALL' || serviceFilter !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => {
                      setStatusFilter('ALL');
                      setServiceFilter('ALL');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer shrink-0"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

            </div>

            {/* Quick summary strip */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Showing {filteredTokens.length} record(s)</span>
              <span className="hidden sm:inline">Sorted by latest creation timestamp</span>
            </div>
          </div>

          {/* Tokens Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead className="bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Token #</th>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Service Category</th>
                    <th className="px-6 py-4">Assigned Counter</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Wait Time</th>
                    <th className="px-6 py-4">Creation Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTokens.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                        <History className="w-10 h-10 mx-auto mb-2 opacity-30 text-purple-600" />
                        <p className="text-base font-bold text-slate-700">No token logs found</p>
                        <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or reset mock data.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTokens.map((token) => (
                      <tr key={token.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-mono-num font-bold text-slate-900">
                          <span className="text-purple-700">{token.tokenNumber}</span>
                          {token.priority === 'PRIORITY' && (
                            <span className="ml-1.5 text-[10px] text-amber-600 font-bold">★ Priority</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800 leading-snug">{token.customerName}</p>
                          <p className="text-xs text-slate-400 font-mono-num">{token.phone || 'No phone'}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">
                          {token.serviceName || (typeof token.serviceId === 'object' ? token.serviceId?.name : 'General Service')}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                          {token.counterNumber || (typeof token.counterId === 'object' ? token.counterId?.name : '—')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={token.status} />
                        </td>
                        <td className="px-6 py-4 text-xs font-mono-num text-slate-500">
                          {token.waitMinutes || 0} mins
                        </td>
                        <td className="px-6 py-4 text-xs font-mono-num text-slate-500">
                          {new Date(token.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs text-slate-500">
                  Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
