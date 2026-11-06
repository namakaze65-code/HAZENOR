<?php

namespace App\Modules\Report\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalProperties = Property::where('status', 'ACTIVE')->count();
        $totalUnits = Unit::count();
        $occupiedUnits = Unit::where('status', 'OCCUPIED')->count();
        $availableUnits = Unit::where('status', 'AVAILABLE')->count();

        // Cash-basis revenue: only VERIFIED payments count
        $verifiedRevenue = Payment::where('status', 'VERIFIED')->sum('amount');
        $pendingPaymentsCount = Payment::where('status', 'PENDING')->count();
        $unpaidInvoicesCount = Invoice::whereIn('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])->count();
        $overdueInvoicesCount = Invoice::where('status', 'OVERDUE')->count();
        $openComplaintsCount = Complaint::whereNotIn('status', ['RESOLVED', 'CLOSED'])->count();

        return response()->json([
            'success' => true,
            'message' => 'Ringkasan laporan operasional dan keuangan berhasil diambil.',
            'data' => [
                'total_properties' => $totalProperties,
                'total_units' => $totalUnits,
                'occupied_units' => $occupiedUnits,
                'available_units' => $availableUnits,
                'occupancy_rate' => $totalUnits > 0 ? round(($occupiedUnits / $totalUnits) * 100, 1) : 0,
                'verified_revenue' => (string) number_format((float) $verifiedRevenue, 2, '.', ''),
                'pending_payments_count' => $pendingPaymentsCount,
                'unpaid_invoices_count' => $unpaidInvoicesCount,
                'overdue_invoices_count' => $overdueInvoicesCount,
                'open_complaints_count' => $openComplaintsCount,
            ],
        ]);
    }

    public function exportCsv(): JsonResponse
    {
        $invoices = Invoice::with('lease.tenant', 'lease.unit')->orderBy('issue_date')->get();

        $lines = [
            'Invoice Number,Tenant,Unit,Period Start,Period End,Due Date,Total,Paid Amount,Status',
        ];

        foreach ($invoices as $inv) {
            $tenantName = str_replace(',', ' ', $inv->lease?->tenant?->full_name ?? '-');
            $unitNumber = str_replace(',', ' ', $inv->lease?->unit?->unit_number ?? '-');
            $lines[] = implode(',', [
                $inv->invoice_number,
                $tenantName,
                $unitNumber,
                $inv->billing_period_start->format('Y-m-d'),
                $inv->billing_period_end->format('Y-m-d'),
                $inv->due_date->format('Y-m-d'),
                $inv->total,
                $inv->paid_amount,
                $inv->status,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan CSV berhasil di-generate.',
            'data' => [
                'filename' => 'ruko360-financial-report-'.now()->format('Ymd-His').'.csv',
                'csv_content' => implode("\n", $lines),
            ],
        ]);
    }
}
