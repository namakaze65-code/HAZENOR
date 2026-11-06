<?php

namespace App\Modules\Payment\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Invoice;
use App\Models\OrganizationBankAccount;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    public function index(): JsonResponse
    {
        $payments = Payment::with(['destinationBankAccount', 'allocations.invoice'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pembayaran berhasil diambil.',
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function storeManual(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'destination_bank_account_id' => ['required', 'uuid'],
            'payment_number' => ['required', 'string', 'max:80'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $bankAccount = OrganizationBankAccount::findOrFail($validated['destination_bank_account_id']);

        $payment = Payment::create([
            'destination_bank_account_id' => $bankAccount->id,
            'payment_number' => $validated['payment_number'],
            'amount' => $validated['amount'],
            'method' => 'MANUAL_TRANSFER',
            'status' => 'PENDING',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran manual tercatat dengan status PENDING dan menunggu verifikasi Finance.',
            'data' => $payment->load('destinationBankAccount'),
        ], 201);
    }

    public function verify(Request $request, string $paymentId): JsonResponse
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'uuid'],
            'allocated_amount' => ['required', 'numeric', 'gt:0'],
        ]);

        return DB::transaction(function () use ($request, $paymentId, $validated) {
            $payment = Payment::lockForUpdate()->findOrFail($paymentId);
            $invoice = Invoice::lockForUpdate()->findOrFail($validated['invoice_id']);

            if ($payment->status === 'VERIFIED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Pembayaran ini sudah diverifikasi sebelumnya.',
                ], 422);
            }

            $remainingInvoiceBalance = bcsub((string) $invoice->total, (string) $invoice->paid_amount, 2);
            if (bccomp((string) $validated['allocated_amount'], $remainingInvoiceBalance, 2) === 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jumlah alokasi melebihi sisa saldo tagihan invoice.',
                ], 422);
            }

            PaymentAllocation::create([
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => $validated['allocated_amount'],
            ]);

            $newPaidAmount = bcadd((string) $invoice->paid_amount, (string) $validated['allocated_amount'], 2);
            $newInvoiceStatus = bccomp($newPaidAmount, (string) $invoice->total, 2) === 0
                ? 'PAID'
                : 'PARTIALLY_PAID';

            $oldInvoiceValues = [
                'paid_amount' => $invoice->paid_amount,
                'status' => $invoice->status,
            ];

            $invoice->update([
                'paid_amount' => $newPaidAmount,
                'status' => $newInvoiceStatus,
            ]);

            $payment->update([
                'status' => 'VERIFIED',
                'verified_at' => now(),
                'verified_by' => $request->user()->id,
            ]);

            AuditLog::create([
                'organization_id' => TenantContext::get(),
                'actor_user_id' => $request->user()->id,
                'action' => 'PAYMENT_VERIFIED',
                'entity_type' => 'Invoice',
                'entity_id' => $invoice->id,
                'old_values' => $oldInvoiceValues,
                'new_values' => [
                    'paid_amount' => $invoice->paid_amount,
                    'status' => $invoice->status,
                    'payment_id' => $payment->id,
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berhasil diverifikasi dan dialokasikan ke invoice.',
                'data' => [
                    'payment' => $payment->fresh(['destinationBankAccount', 'allocations']),
                    'invoice' => $invoice->fresh(),
                ],
            ]);
        });
    }

    public function reject(Request $request, string $paymentId): JsonResponse
    {
        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        return DB::transaction(function () use ($request, $paymentId, $validated) {
            $payment = Payment::lockForUpdate()->findOrFail($paymentId);

            if ($payment->status !== 'PENDING') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya pembayaran berstatus PENDING yang dapat ditolak.',
                ], 422);
            }

            $oldStatus = $payment->status;
            $payment->update([
                'status' => 'REJECTED',
                'rejection_reason' => $validated['rejection_reason'],
                'verified_at' => now(),
                'verified_by' => $request->user()->id,
            ]);

            AuditLog::create([
                'organization_id' => TenantContext::get(),
                'actor_user_id' => $request->user()->id,
                'action' => 'PAYMENT_REJECTED',
                'entity_type' => 'Payment',
                'entity_id' => $payment->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => [
                    'status' => 'REJECTED',
                    'rejection_reason' => $validated['rejection_reason'],
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran manual telah ditolak.',
                'data' => $payment,
            ]);
        });
    }

    public function refund(Request $request, string $paymentId): JsonResponse
    {
        return DB::transaction(function () use ($request, $paymentId) {
            $payment = Payment::with('allocations')->lockForUpdate()->findOrFail($paymentId);

            if ($payment->status !== 'VERIFIED') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya pembayaran terverifikasi yang dapat di-refund/reversal.',
                ], 422);
            }

            foreach ($payment->allocations as $allocation) {
                $invoice = Invoice::lockForUpdate()->find($allocation->invoice_id);
                if ($invoice) {
                    $newPaid = bcsub((string) $invoice->paid_amount, (string) $allocation->amount, 2);
                    if (bccomp($newPaid, '0.00', 2) === -1) {
                        $newPaid = '0.00';
                    }
                    $newStatus = bccomp($newPaid, '0.00', 2) === 0 ? 'UNPAID' : 'PARTIALLY_PAID';
                    $invoice->update([
                        'paid_amount' => $newPaid,
                        'status' => $newStatus,
                    ]);
                }
            }

            $payment->allocations()->delete();
            $payment->update(['status' => 'REFUNDED']);

            AuditLog::create([
                'organization_id' => TenantContext::get(),
                'actor_user_id' => $request->user()->id,
                'action' => 'PAYMENT_REFUNDED',
                'entity_type' => 'Payment',
                'entity_id' => $payment->id,
                'old_values' => ['status' => 'VERIFIED'],
                'new_values' => ['status' => 'REFUNDED'],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran telah di-refund dan saldo tagihan invoice dihitung ulang.',
                'data' => $payment->fresh(),
            ]);
        });
    }

    public function handleWebhook(Request $request, string $provider): JsonResponse
    {
        // Reject callbacks that do not carry the shared gateway secret, otherwise anyone
        // could mark an invoice as paid by calling this public endpoint directly.
        $expectedSecret = (string) config('services.payment_webhook.secret');
        if ($expectedSecret === '') {
            return response()->json([
                'success' => false,
                'message' => 'Payment gateway belum dikonfigurasi (PAYMENT_WEBHOOK_SECRET kosong).',
            ], 503);
        }

        if (! hash_equals($expectedSecret, (string) $request->header('X-Webhook-Secret'))) {
            return response()->json([
                'success' => false,
                'message' => 'Signature webhook tidak valid.',
            ], 401);
        }

        $validated = $request->validate([
            'provider_event_id' => ['required', 'string', 'max:180'],
            'organization_id' => ['required', 'uuid'],
            'invoice_id' => ['required', 'uuid'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'provider_reference' => ['required', 'string', 'max:180'],
        ]);

        // Idempotency check on provider_event_id (PAY-07)
        $alreadyProcessed = DB::table('payment_gateway_events')
            ->where('provider_event_id', $validated['provider_event_id'])
            ->exists();

        if ($alreadyProcessed) {
            return response()->json([
                'success' => true,
                'message' => 'Webhook duplikat terdeteksi dan diabaikan secara idempoten.',
                'data' => ['idempotent_duplicate' => true],
            ]);
        }

        return DB::transaction(function () use ($request, $provider, $validated) {
            DB::table('payment_gateway_events')->insert([
                'id' => (string) Str::uuid(),
                'provider' => strtoupper($provider),
                'provider_event_id' => $validated['provider_event_id'],
                'payload' => json_encode($request->all()),
                'signature_verified' => true,
                'processed_at' => now(),
                'created_at' => now(),
            ]);

            TenantContext::set($validated['organization_id'], 'WEBHOOK_GATEWAY');

            try {
                $invoice = Invoice::lockForUpdate()->findOrFail($validated['invoice_id']);

                $payment = Payment::create([
                    'payment_number' => 'GW-'.strtoupper(Str::random(8)),
                    'amount' => $validated['amount'],
                    'method' => 'PAYMENT_GATEWAY',
                    'provider' => strtoupper($provider),
                    'provider_reference' => $validated['provider_reference'],
                    'status' => 'VERIFIED',
                    'paid_at' => now(),
                    'verified_at' => now(),
                ]);

                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $validated['amount'],
                ]);

                $newPaid = bcadd((string) $invoice->paid_amount, (string) $validated['amount'], 2);
                $newStatus = bccomp($newPaid, (string) $invoice->total, 2) >= 0 ? 'PAID' : 'PARTIALLY_PAID';

                $invoice->update([
                    'paid_amount' => $newPaid,
                    'status' => $newStatus,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Webhook payment gateway berhasil diverifikasi dan dialokasikan.',
                    'data' => [
                        'payment_id' => $payment->id,
                        'invoice_status' => $invoice->status,
                    ],
                ]);
            } finally {
                TenantContext::clear();
            }
        });
    }

    public function generateProofSignedUrl(string $paymentId): JsonResponse
    {
        $payment = Payment::findOrFail($paymentId);

        $signedUrl = URL::temporarySignedRoute(
            'files.payment-proof.download',
            now()->addMinutes(10),
            [
                'org' => TenantContext::get(),
                'payment' => $payment->id,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Signed Temporary URL berhasil dibuat (berlaku 10 menit).',
            'data' => [
                'signed_url' => $signedUrl,
                'expires_in_seconds' => 600,
            ],
        ]);
    }

    public function initiateTenantPayment(Request $request, string $invoiceId): JsonResponse
    {
        $invoice = Invoice::findOrFail($invoiceId);

        $validated = $request->validate([
            'destination_bank_account_id' => ['required', 'uuid'],
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        $bankAccount = OrganizationBankAccount::findOrFail($validated['destination_bank_account_id']);

        $payment = Payment::create([
            'destination_bank_account_id' => $bankAccount->id,
            'payment_number' => 'PAY-'.now()->format('Ymd').'-'.rand(1000, 9999),
            'amount' => $validated['amount'],
            'method' => 'MANUAL_TRANSFER',
            'status' => 'PENDING',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Konfirmasi pembayaran untuk tagihan {$invoice->invoice_number} berhasil dikirim.",
            'data' => $payment->load('destinationBankAccount'),
        ], 201);
    }
}
