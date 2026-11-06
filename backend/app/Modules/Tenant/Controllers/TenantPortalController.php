<?php

namespace App\Modules\Tenant\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\ComplaintMessage;
use App\Models\ComplaintStatusHistory;
use App\Models\Invoice;
use App\Models\Lease;
use App\Models\OrganizationBankAccount;
use App\Models\Payment;
use App\Models\Tenant;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Portal Penyewa API.
 *
 * Every query here is restricted to the tenant record linked to the logged-in
 * user (request attribute "tenant_id", set by ResolveOrganizationContext), so a
 * tenant can never read invoices, units, or complaints belonging to another tenant.
 */
class TenantPortalController extends Controller
{
    private function tenantId(Request $request): string
    {
        return (string) $request->attributes->get('tenant_id');
    }

    private function leaseIds(Request $request)
    {
        return Lease::where('tenant_id', $this->tenantId($request))->pluck('id');
    }

    public function overview(Request $request): JsonResponse
    {
        $tenant = Tenant::with('leases.unit.property')->findOrFail($this->tenantId($request));

        $units = $tenant->leases
            ->map(fn ($lease) => $lease->unit)
            ->filter()
            ->unique('id')
            ->values();

        $banks = OrganizationBankAccount::where('is_active', true)
            ->orderByDesc('is_primary')
            ->get(['id', 'bank_name', 'account_number', 'account_holder_name', 'is_primary']);

        $org = DB::table('organizations')
            ->where('id', TenantContext::get())
            ->first(['id', 'name']);

        return response()->json([
            'success' => true,
            'message' => 'Data portal penyewa berhasil diambil.',
            'data' => [
                'tenant' => $tenant,
                'units' => $units,
                'bank_accounts' => $banks,
                'organization' => $org,
            ],
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $invoices = Invoice::with(['items', 'lease.tenant', 'lease.unit.property'])
            ->whereIn('lease_id', $this->leaseIds($request))
            ->latest('issue_date')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar tagihan penyewa berhasil diambil.',
            'data' => $invoices,
        ]);
    }

    public function submitPayment(Request $request, string $invoiceId): JsonResponse
    {
        $invoice = Invoice::whereIn('lease_id', $this->leaseIds($request))->findOrFail($invoiceId);

        $validated = $request->validate([
            'destination_bank_account_id' => ['required', 'uuid'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $bankAccount = OrganizationBankAccount::findOrFail($validated['destination_bank_account_id']);

        $payment = Payment::create([
            'destination_bank_account_id' => $bankAccount->id,
            'payment_number' => 'PAY-'.now()->format('Ymd').'-'.strtoupper(Str::random(6)),
            'amount' => $validated['amount'],
            'method' => 'MANUAL_TRANSFER',
            'status' => 'PENDING',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Konfirmasi pembayaran untuk tagihan {$invoice->invoice_number} berhasil dikirim dan menunggu verifikasi.",
            'data' => $payment->load('destinationBankAccount'),
        ], 201);
    }

    public function complaints(Request $request): JsonResponse
    {
        $complaints = Complaint::with(['tenant', 'unit.property', 'statusHistory', 'messages'])
            ->where('tenant_id', $this->tenantId($request))
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar keluhan penyewa berhasil diambil.',
            'data' => $complaints,
        ]);
    }

    public function storeComplaint(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['required', 'uuid'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:50'],
            'priority' => ['required', Rule::in(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])],
        ]);

        $tenantId = $this->tenantId($request);

        // The unit must be one the tenant actually rents
        $ownsUnit = Lease::where('tenant_id', $tenantId)
            ->where('unit_id', $validated['unit_id'])
            ->exists();

        if (! $ownsUnit) {
            return response()->json([
                'success' => false,
                'message' => 'Unit tidak terdaftar pada kontrak sewa Anda.',
            ], 403);
        }

        return DB::transaction(function () use ($request, $validated, $tenantId) {
            $complaint = Complaint::create([
                'tenant_id' => $tenantId,
                'unit_id' => $validated['unit_id'],
                'ticket_number' => 'TCK-'.now()->format('Ymd').'-'.strtoupper(Str::random(5)),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'category' => $validated['category'] ?? 'UMUM',
                'priority' => $validated['priority'],
                'status' => 'NEW',
            ]);

            ComplaintStatusHistory::create([
                'complaint_id' => $complaint->id,
                'old_status' => null,
                'new_status' => 'NEW',
                'changed_by' => $request->user()->id,
                'note' => 'Tiket keluhan dibuat oleh penyewa.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tiket keluhan berhasil dibuat.',
                'data' => $complaint->load(['tenant', 'unit', 'statusHistory']),
            ], 201);
        });
    }

    public function storeComplaintMessage(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $complaint = Complaint::where('tenant_id', $this->tenantId($request))->findOrFail($id);

        $msg = ComplaintMessage::create([
            'complaint_id' => $complaint->id,
            'sender_user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dikirim ke tiket keluhan.',
            'data' => $msg,
        ], 201);
    }

    public function storeComplaintAttachment(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => ['required', 'string', 'max:500'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'mime_type' => ['required', 'string', 'max:100'],
            'file_size' => ['required', 'integer', 'min:1', 'max:10485760'],
        ]);

        $complaint = Complaint::where('tenant_id', $this->tenantId($request))->findOrFail($id);
        $attachmentId = (string) Str::uuid();

        DB::table('complaint_attachments')->insert([
            'id' => $attachmentId,
            'organization_id' => $complaint->organization_id,
            'complaint_id' => $complaint->id,
            'storage_key' => $validated['file_path'],
            'original_filename' => $validated['original_filename'] ?? basename($validated['file_path']),
            'mime_type' => $validated['mime_type'],
            'size_bytes' => $validated['file_size'],
            'uploaded_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lampiran keluhan berhasil disimpan.',
            'data' => ['id' => $attachmentId, 'complaint_id' => $complaint->id],
        ], 201);
    }
}
