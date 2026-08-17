import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Package, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { DataTablePagination } from "@/components/ui/data-table-pagination";

interface HistoryEntry {
  date: string;
  transaction_type: string;
  quantity: number;
  stock_before: number;
  stock_after: number;
  source_type: string;
  source_id: string;
}

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  itemName: string | null;
}

export function StockHistoryModal({ isOpen, onClose, itemId, itemName }: StockHistoryModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (isOpen && itemId) {
      fetchHistory();
    }
  }, [isOpen, itemId]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('campusspend_token');
      const res = await fetch(
        `${(import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'))}/api/inventory/${itemId}/history/`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.ok) {
        const data = await res.json();
        // The API returns the history sorted by timestamp ascending
        // Let's display it descending (newest first) for better UX in a scrollable list
        const sortedHistory = [...data.history].reverse();
        setHistory(sortedHistory);
        setCurrentStock(data.current_stock);
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'OPENING_BALANCE':
        return (
          <Badge className="bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 border-sky-500/30 flex items-center gap-1 w-fit">
            <Package className="h-3 w-3" />
            Opening Balance
          </Badge>
        );
      case 'GRN_RECEIPT':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30 flex items-center gap-1 w-fit">
            <ArrowUpRight className="h-3 w-3" />
            GRN Receipt
          </Badge>
        );
      case 'GOODS_ISSUE':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/30 flex items-center gap-1 w-fit">
            <ArrowDownLeft className="h-3 w-3" />
            Goods Issue
          </Badge>
        );
      case 'RETURN_TO_VENDOR':
        return (
          <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/30 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            Return to Vendor
          </Badge>
        );
      case 'MANUAL_ADJUSTMENT':
        return (
          <Badge className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/30 flex items-center gap-1 w-fit">
            <RefreshCw className="h-3 w-3" />
            Manual Adjustment
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            {type}
          </Badge>
        );
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-4 border-b">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Stock Movement History
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {itemName} <span className="text-muted-foreground">({itemId})</span>
              </DialogDescription>
            </div>
            <div className="mt-2 md:mt-0 flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1 text-sm bg-muted/50">
                Current Stock: <span className="font-bold text-foreground ml-1">{currentStock}</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading transaction records...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">No stock ledger entries found for this item.</span>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[50vh] pr-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 sticky top-0 backdrop-blur-sm">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date & Time</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Transaction Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Qty</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Stock Before</th>
                    <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Stock After</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((entry, idx) => (
                    <tr
                      key={idx}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                          {formatDate(entry.date)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getTransactionBadge(entry.transaction_type)}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        <span
                          className={
                            ['GOODS_ISSUE', 'RETURN_TO_VENDOR'].includes(entry.transaction_type)
                              ? 'text-rose-500'
                              : 'text-emerald-500'
                          }
                        >
                          {['GOODS_ISSUE', 'RETURN_TO_VENDOR'].includes(entry.transaction_type) ? '-' : '+'}
                          {entry.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {entry.stock_before}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">
                        {entry.stock_after}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-xs">{entry.source_id}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{entry.source_type}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
            {history.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(history.length / PAGE_SIZE)}
                  onPageChange={setCurrentPage}
                  onNextPage={() => setCurrentPage((p) => Math.min(Math.ceil(history.length / PAGE_SIZE), p + 1))}
                  onPrevPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
