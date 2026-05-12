import { useEffect, useMemo, useState } from 'react'
import { logsApi } from '@/api'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Download, Filter, RefreshCw, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'

interface LogQuery {
  page?: number
  limit?: number
  sortBy?: string
  order?: 'asc' | 'desc'
  action?: string
  module?: string
  companyName?: string
  platform?: string
  source?: string
  search?: string
  startDate?: string
  endDate?: string
  severity?: string
}

interface ApiResponse<T> {
  status: boolean
  message: string
  data: {
    items: T[]
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface ActivityLogItem {
  _id: string
  action?: string
  module?: string
  payload?: unknown
  previousData?: unknown
  ip?: string
  userObjectId?: string
  message?: string
  platform?: string
  source?: string
  role?: string[]
  companyName?: string
  companyDb_uri?: string
  companyDbName?: string
  createdAt?: string
  admin?: {
    name?: string
    first_name?: string
    last_name?: string
    email?: string
  }
}

interface ExceptionLogItem extends ActivityLogItem {
  severity?: 'low' | 'medium' | 'high'
}

type LogItem = ActivityLogItem | ExceptionLogItem

const toPlainObject = (data: unknown): Record<string, unknown> => {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>
  }
  return {}
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'N/A'

  if (typeof value === 'string') {
    // Try to detect ISO-like date strings and format them nicely
    const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    if (isoLike.test(value)) {
      const d = new Date(value)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString()
      }
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (value instanceof Date) return value.toLocaleString()

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const formatDateOnly = (value: unknown): string => {
  if (value === null || value === undefined) return 'N/A'

  if (typeof value === 'string') {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString()
    }
    return value
  }

  if (value instanceof Date) return value.toLocaleDateString()

  return formatValue(value)
}

export default function LogsPage() {
  const [tab, setTab] = useState<'activity' | 'exceptions'>('activity')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [showFilters, setShowFilters] = useState(false)

  // filters
  const [moduleFilter, setModuleFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedModuleFilter, setAppliedModuleFilter] = useState('')
  const [appliedActionFilter, setAppliedActionFilter] = useState('')
  const [appliedSeverityFilter, setAppliedSeverityFilter] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')
  const [companyNameFilter, setCompanyNameFilter] = useState('')
  const [appliedCompanyNameFilter, setAppliedCompanyNameFilter] = useState('')

  // pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [items, setItems] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  const navigate = useNavigate();

  const params: LogQuery = useMemo(() => ({
    page,
    limit,
    module: appliedModuleFilter || undefined,
    action: appliedActionFilter || undefined,
    severity: tab === 'exceptions' && appliedSeverityFilter ? appliedSeverityFilter : undefined,
    search: appliedSearch || undefined,
    startDate: appliedStartDate || undefined,
    endDate: appliedEndDate || undefined,
    companyName: appliedCompanyNameFilter || undefined,

    sortBy: 'createdAt',
    order: 'desc',
  }), [
    page,
    limit,
    appliedModuleFilter,
    appliedActionFilter,
    appliedSeverityFilter,
    appliedSearch,
    appliedStartDate,
    appliedEndDate,
    appliedCompanyNameFilter,
    tab,
  ])

  const hasActiveFilters = useMemo(() => {
    return !!(
      appliedModuleFilter ||
      appliedActionFilter ||
      appliedSeverityFilter ||
      appliedSearch ||
      appliedStartDate ||
      appliedEndDate ||
      appliedCompanyNameFilter
    )
  }, [
    appliedModuleFilter,
    appliedActionFilter,
    appliedSeverityFilter,
    appliedSearch,
    appliedStartDate,
    appliedEndDate,
    appliedCompanyNameFilter,
  ])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(undefined)
      const res: ApiResponse<LogItem> = tab === 'activity'
        ? await logsApi.getActivityLogs(params)
        : await logsApi.getExceptionLogs(params)
      setItems(res.data.items || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 0)
    } catch (e) {
      const errorMessage = e instanceof Error
        ? e.message
        : typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to load logs'
          : 'Failed to load logs'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [tab])

  useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tab,
    page,
    limit,
    appliedModuleFilter,
    appliedActionFilter,
    appliedSeverityFilter,
    appliedSearch,
    appliedStartDate,
    appliedEndDate,
    appliedCompanyNameFilter,
  ])

  const onApplyFilters = () => {
    setAppliedModuleFilter(moduleFilter)
    setAppliedActionFilter(actionFilter)
    setAppliedSeverityFilter(severityFilter)
    setAppliedCompanyNameFilter(companyNameFilter)

    setAppliedSearch(search)
    setAppliedStartDate(startDate)
    setAppliedEndDate(endDate)
    setPage(1)
  }

  const onClearFilters = () => {
    setModuleFilter('')
    setActionFilter('')
    setSeverityFilter('')
      setCompanyNameFilter('') // Add this line

    setSearch('')
    setStartDate('')
    setEndDate('')
    setAppliedModuleFilter('')
    setAppliedActionFilter('')
      setAppliedCompanyNameFilter('') // Add this line

    setAppliedSeverityFilter('')
    setAppliedSearch('')
    setAppliedStartDate('')
    setAppliedEndDate('')
    setPage(1)
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'high': return { variant: 'destructive' as const, className: 'bg-red-500 text-white' }
      case 'medium': return { variant: 'default' as const, className: 'bg-yellow-500 text-white' }
      case 'low': return { variant: 'secondary' as const, className: 'bg-green-500 text-white' }
      default: return { variant: 'outline' as const, className: '' }
    }
  }

  const exportLogs = () => {
    // Create headers that match the table exactly
    const headers = [
      'Time',
      'Module', 
      tab === 'exceptions' ? 'Severity' : 'Action',
      'Message',
      'User',
      'Role',
      'Platform',
      'Source',
      'Company'
    ]

    // Create data rows
    const data = items.map((item) => [
      item.createdAt ? new Date(item.createdAt).toLocaleString() : '-',
      item.module || '-',
      tab === 'exceptions' ? ((item as ExceptionLogItem).severity || '-') : (item.action || '-'),
      item.message || '-',
      item.admin?.email || item.userObjectId || '-',
      Array.isArray(item.role) ? item.role.join(', ') : (item.role || '-'),
      item.platform || '-',
      item.source || '-',
      item.companyName || '-',
    ])

    // Create worksheet with headers and data
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])

    // Set column widths for better spacing
    const columnWidths = [
      { wch: 20 }, // Time - wider for datetime
      { wch: 15 }, // Module
      { wch: 15 }, // Action/Severity
      { wch: 40 }, // Message - much wider for long messages
      { wch: 20 }, // User
      { wch: 15 }, // Role
      { wch: 12 }, // Platform
      { wch: 12 }, // Source
      { wch: 20 }, // Company
    ]
    worksheet['!cols'] = columnWidths

    // Style the header row
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
    const worksheetWithStyles = worksheet as XLSX.WorkSheet & Record<string, XLSX.CellObject>
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheetWithStyles[cellAddress]) continue
      worksheetWithStyles[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E5E7EB' } },
        alignment: { horizontal: 'center' }
      }
    }

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, `${tab === 'exceptions' ? 'Exception' : 'Activity'} Logs`)

    // Generate filename with current date
    const filename = `${tab}-logs-${new Date().toISOString().split('T')[0]}.xlsx`
    
    // Save the file
    XLSX.writeFile(workbook, filename)
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 md:p-8 max-w-[1600px]">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">System Logs</h1>
          <p className="text-slate-600 dark:text-slate-400">Monitor and track system activities and exceptions</p>
        </div>
         <Button
    variant="outline"
    onClick={() => navigate('/dashboard')}
    className="flex items-center gap-2 mb-2"
  >
    <ChevronLeft className="w-4 h-4" />
    Back to Dashboard
  </Button>


        <Card className="shadow-xl border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b bg-white dark:bg-slate-900">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'activity' | 'exceptions')} className="w-full lg:w-auto">
                <TabsList className="grid w-full lg:w-[400px] grid-cols-2 h-11">
                  <TabsTrigger value="activity" className="text-sm font-medium">
                    Activity Logs
                  </TabsTrigger>
                  <TabsTrigger value="exceptions" className="text-sm font-medium">
                    Exception Logs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLogs}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportLogs}
                  disabled={items.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {showFilters && (
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filter Options</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Module</label>
                    <Input 
                      placeholder="Filter by module" 
                      value={moduleFilter} 
                      onChange={(e) => setModuleFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Action</label>
                    <Input 
                      placeholder="Filter by action" 
                      value={actionFilter} 
                      onChange={(e) => setActionFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  {tab === 'exceptions' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Severity</label>
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Add Company Name filter here */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                    <Input 
                      placeholder="Filter by company name" 
                      value={companyNameFilter} 
                      onChange={(e) => setCompanyNameFilter(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Search Message</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Search in messages" 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Start Date</label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">End Date</label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button onClick={onApplyFilters} disabled={loading} size="sm" className="font-medium">
                    Apply Filters
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onClearFilters} 
                    disabled={loading || !hasActiveFilters}
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="overflow-auto" style={{ maxHeight: '600px' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[160px]">Time</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[120px]">Module</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[120px]">
                        {tab === 'exceptions' ? 'Severity' : 'Action'}
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 min-w-[200px]">Message</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[140px]">Email</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[120px]">Role</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[100px]">Platform</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[100px]">Source</th>
                      <th className="h-12 px-4 text-left align-middle font-semibold text-slate-700 dark:text-slate-300 w-[140px]">Company</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="h-48 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
                            <span className="text-slate-500 font-medium">Loading logs...</span>
                          </div>
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="h-48 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                              <AlertCircle className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                              <p className="text-slate-700 dark:text-slate-300 font-medium">No records found</p>
                              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr 
                          key={item._id} 
                          className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-4 align-middle text-xs text-slate-600 dark:text-slate-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="font-medium">{item.module || '-'}</Badge>
                          </td>
                          <td className="p-4 align-middle">
                            {tab === 'exceptions' ? (
                              <Badge {...getSeverityColor((item as ExceptionLogItem).severity)} className="font-medium">
                                {(item as ExceptionLogItem).severity || '-'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="font-medium">{item.action || '-'}</Badge>
                            )}
                          </td>
                          <td className="p-4 align-middle max-w-[300px]">
                            <div className="flex flex-col gap-1.5">
                              <div className="truncate text-slate-700 dark:text-slate-300" title={item.message}>
                                {item.message || '-'}
                              </div>
                              {(!!item.payload || !!item.previousData) && (
                                <button
                                  type="button"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline-offset-2 hover:underline self-start font-medium transition-colors"
                                  onClick={() => setSelectedLog(item)}
                                >
                                  View details →
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle truncate text-slate-700 dark:text-slate-300" title={item.admin?.email || item.userObjectId}>
                            {item.admin?.email || item.userObjectId || '-'}
                          </td>
                          <td className="p-4 align-middle text-xs text-slate-600 dark:text-slate-400">
                            {Array.isArray(item.role) ? item.role.join(', ') : (item.role || '-')}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="text-xs font-medium">
                              {item.platform || '-'}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-xs text-slate-600 dark:text-slate-400">{item.source || '-'}</td>
                          <td className="p-4 align-middle truncate text-xs text-slate-600 dark:text-slate-400" title={item.companyName}>
                            {item.companyName || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Showing <span className="text-slate-900 dark:text-slate-100 font-semibold">{items.length > 0 ? ((page - 1) * limit) + 1 : 0}</span> - <span className="text-slate-900 dark:text-slate-100 font-semibold">{Math.min(page * limit, total)}</span> of <span className="text-slate-900 dark:text-slate-100 font-semibold">{total}</span> records
              </div>
              <div className="flex items-center gap-3">
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                  <SelectTrigger className="w-[110px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 rows</SelectItem>
                    <SelectItem value="20">20 rows</SelectItem>
                    <SelectItem value="50">50 rows</SelectItem>
                    <SelectItem value="100">100 rows</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Page {page} of {Math.max(1, pages)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={loading || page <= 1} 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={loading || page >= pages} 
                    onClick={() => setPage(p => p + 1)}
                    className="h-9"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Log Details</DialogTitle>
              <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {selectedLog?.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Time:</span>
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  )}
                  {selectedLog?.module && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Module:</span>
                      {selectedLog.module}
                    </span>
                  )}
                  {selectedLog?.action ? (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Action:</span>
                      {selectedLog.action}
                    </span>
                  ) : (tab === 'exceptions' && (selectedLog as ExceptionLogItem)?.severity) && (
                    <span className="flex items-center gap-1.5">
                      <span className="font-medium">Severity:</span>
                      {(selectedLog as ExceptionLogItem).severity}
                    </span>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto py-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700 dark:to-transparent rounded"></div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Field Comparison</h3>
                  <div className="h-1 flex-1 bg-gradient-to-l from-slate-200 to-transparent dark:from-slate-700 dark:to-transparent rounded"></div>
                </div>
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  {(() => {
                    const prev = toPlainObject(selectedLog?.previousData)
                    const curr = toPlainObject(selectedLog?.payload)
                    const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)])).sort()

                    if (keys.length === 0) {
                      return (
                        <div className="p-8 text-center">
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                            <AlertCircle className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 font-medium">No structured data available for this log</p>
                        </div>
                      )
                    }

                    const admin = selectedLog?.admin
                    const adminDisplayName = admin
                      ? [admin.first_name, admin.last_name]
                          .filter(Boolean)
                          .join(' ') || admin.name || admin.email || ''
                      : ''

                    return (
                      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900">
                            <tr>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 w-[30%]">Field Name</th>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 w-[35%]">Previous Value</th>
                              <th className="text-left px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 w-[35%]">Current Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {keys.map((key, idx) => {
                              const prevVal = prev[key]
                              const currVal = curr[key]
                              const prevText = formatValue(prevVal)
                              const currText = formatValue(currVal)
                              const changed = prevText !== currText
                              const isActorField = key === 'created_by' || key === 'updated_by'
                              const isDateField = key === 'created_date' || key === 'updated_date'

                              const prevDisplay = isActorField
                                ? (prevVal ? (adminDisplayName || 'N/A') : 'N/A')
                                : isDateField
                                  ? formatDateOnly(prevVal)
                                  : prevText

                              const currDisplay = isActorField
                                ? (currVal ? (adminDisplayName || 'N/A') : 'N/A')
                                : isDateField
                                  ? formatDateOnly(currVal)
                                  : currText

                              return (
                                <tr 
                                  key={key} 
                                  className={`${changed ? 'bg-amber-50/80 dark:bg-amber-900/20' : idx % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-900'} transition-colors`}
                                >
                                  <td className="px-4 py-2.5 align-top font-semibold text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                      {changed && (
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                      )}
                                      {key}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 align-top border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                    {prevDisplay}
                                  </td>
                                  <td className="px-4 py-2.5 align-top border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                    {currDisplay}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}