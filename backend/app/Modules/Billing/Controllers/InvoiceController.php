<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\SendWhatsAppNotificationJob;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Lease;
use App\Models\NotificationRecord;
use App\Modules\Billing\Services\BillingEngineService;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(): JsonResponse
    {
        $invoices = Invoice::with(['items', 'lease.tenant', 'lease.unit'])
            ->latest('issue_date')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar invoice berhasil diambil.',
            'data' => $invoices->items(),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lease_id' => ['required', 'uuid'],
            'invoice_number' => ['required', 'string', 'max:80'],
            'billing_period_start' => ['required', 'date'],
            'billing_period_end' => ['required', 'date', 'after_or_equal:billing_period_start'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'tax' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $lease = Lease::findOrFail($validated['lease_id']);

        $duplicatePeriod = Invoice::where('lease_id', $lease->id)
            ->where('billing_period_start', $validated['billing_period_start'])
            ->exists();

        if ($duplicatePeriod) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice untuk kontrak dan periode awal ini sudah pernah diterbitkan.',
                'errors' => [
                    'billing_period_start' => ['Periode tagihan tidak boleh terbit ganda.'],
                ],
            ], 422);
        }

        return DB::transaction(function () use ($validated, $lease) {
            $subtotal = '0.00';
            $preparedItems = [];

            foreach ($validated['items'] as $item) {
                $amount = bcmul((string) $item['quantity'], (string) $item['unit_price'], 2);
                $subtotal = bcadd($subtotal, $amount, 2);
                $preparedItems[] = [
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'amount' => $amount,
                ];
            }

            $discount = (string) ($validated['discount'] ?? 0);
            $tax = (string) ($validated['tax'] ?? 0);
            $total = bcadd(bcsub($subtotal, $discount, 2), $tax, 2);

            $invoice = Invoice::create([
                'lease_id' => $lease->id,
                'invoice_number' => $validated['invoice_number'],
                'billing_period_start' => $validated['billing_period_start'],
                'billing_period_end' => $validated['billing_period_end'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'paid_amount' => 0,
                'status' => 'UNPAID',
            ]);

            foreach ($preparedItems as $row) {
                InvoiceItem::create(array_merge($row, ['invoice_id' => $invoice->id]));
            }

            return response()->json([
                'success' => true,
                'message' => 'Invoice berhasil diterbitkan.',
                'data' => $invoice->load('items'),
            ], 201);
        });
    }

    public function sendReminder(string $id): JsonResponse
    {
        $invoice = Invoice::with('lease.tenant')->findOrFail($id);

        if (in_array($invoice->status, ['PAID', 'CANCELLED'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice yang sudah lunas atau dibatalkan tidak dapat dikirimi pengingat tunggakan.',
            ], 422);
        }

        $recipient = $invoice->lease?->tenant?->phone ?? '081199887766';
        $orgId = TenantContext::get();

        $notif = NotificationRecord::create([
            'user_id' => $invoice->lease?->tenant?->user_id,
            'channel' => 'WHATSAPP',
            'template_key' => 'INVOICE_REMINDER_MANUAL',
            'recipient' => $recipient,
            'payload' => [
                'invoice_number' => $invoice->invoice_number,
                'total' => $invoice->total,
                'paid_amount' => $invoice->paid_amount,
                'due_date' => $invoice->due_date->format('Y-m-d'),
                'tenant_name' => $invoice->lease?->tenant?->full_name,
            ],
            'status' => 'PENDING',
        ]);

        // Dispatch through queue (runs synchronously or via Redis worker with explicit TenantContext)
        SendWhatsAppNotificationJob::dispatchSync($orgId, $notif->id);

        return response()->json([
            'success' => true,
            'message' => "Pengingat WhatsApp untuk {$invoice->invoice_number} berhasil dikirim ke {$recipient}.",
            'data' => $notif->fresh('logs'),
        ]);
    }

    public function runBillingEngine(Request $request, BillingEngineService $engine): JsonResponse
    {
        $summary = $engine->runForCurrentOrganization($request->user()?->id);

        return response()->json([
            'success' => true,
            'message' => "Mesin penagihan selesai: {$summary['generated_invoices_count']} invoice baru diterbitkan, {$summary['marked_overdue_count']} invoice ditandai OVERDUE.",
            'data' => $summary,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $invoice = Invoice::with(['items', 'lease.tenant', 'lease.unit.property'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail tagihan berhasil diambil.',
            'data' => $invoice,
        ]);
    }

    public function tenantInvoices(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['items', 'lease.tenant', 'lease.unit.property'])
            ->latest('issue_date')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tagihan penyewa berhasil diambil.',
            'data' => $invoices,
        ]);
    }
}
