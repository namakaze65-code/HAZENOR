<?php

namespace App\Modules\Lease\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BillingSchedule;
use App\Models\Lease;
use App\Models\Tenant;
use App\Models\Unit;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LeaseController extends Controller
{
    public function index(): JsonResponse
    {
        $leases = Lease::with(['unit.property', 'tenant'])->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar kontrak sewa berhasil diambil.',
            'data' => $leases->items(),
            'meta' => [
                'current_page' => $leases->currentPage(),
                'per_page' => $leases->perPage(),
                'total' => $leases->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unit_id' => ['required', 'uuid'],
            'tenant_id' => ['required', 'uuid'],
            'lease_number' => ['required', 'string', 'max:80'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'rental_price' => ['required', 'numeric', 'min:0'],
            'billing_cycle' => ['required', Rule::in(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY'])],
            'due_day' => ['required', 'integer', 'min:1', 'max:28'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'terms' => ['nullable', 'string'],
        ]);

        $unit = Unit::findOrFail($validated['unit_id']);
        $tenant = Tenant::findOrFail($validated['tenant_id']);

        $hasOverlap = Lease::where('unit_id', $unit->id)
            ->whereIn('status', ['ACTIVE', 'PENDING'])
            ->where('start_date', '<=', $validated['end_date'])
            ->where('end_date', '>=', $validated['start_date'])
            ->exists();

        if ($hasOverlap) {
            return response()->json([
                'success' => false,
                'message' => 'Unit ini sudah memiliki kontrak aktif pada periode yang beririsan.',
                'errors' => [
                    'unit_id' => ['Unit tidak dapat disewakan pada rentang tanggal yang tumpang tindih.'],
                ],
            ], 422);
        }

        return DB::transaction(function () use ($validated, $unit, $tenant) {
            $lease = Lease::create([
                'unit_id' => $unit->id,
                'tenant_id' => $tenant->id,
                'lease_number' => $validated['lease_number'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'rental_price' => $validated['rental_price'],
                'billing_cycle' => $validated['billing_cycle'],
                'due_day' => $validated['due_day'],
                'deposit_amount' => $validated['deposit_amount'] ?? 0,
                'status' => 'ACTIVE',
                'terms' => $validated['terms'] ?? null,
            ]);

            BillingSchedule::create([
                'lease_id' => $lease->id,
                'next_run_date' => $validated['start_date'],
                'billing_cycle' => $validated['billing_cycle'],
                'is_active' => true,
            ]);

            $unit->update(['status' => 'OCCUPIED']);

            return response()->json([
                'success' => true,
                'message' => 'Kontrak sewa dan jadwal penagihan berhasil dibuat.',
                'data' => $lease->load(['unit.property', 'tenant']),
            ], 201);
        });
    }

    public function terminate(Request $request, string $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $lease = Lease::with('unit')->lockForUpdate()->findOrFail($id);
            $oldStatus = $lease->status;

            $lease->update(['status' => 'TERMINATED']);

            BillingSchedule::where('lease_id', $lease->id)->update(['is_active' => false]);

            if ($lease->unit) {
                $otherActive = Lease::where('unit_id', $lease->unit->id)
                    ->where('id', '!=', $lease->id)
                    ->where('status', 'ACTIVE')
                    ->exists();

                if (! $otherActive) {
                    $lease->unit->update(['status' => 'AVAILABLE']);
                }
            }

            AuditLog::create([
                'organization_id' => TenantContext::get(),
                'actor_user_id' => $request->user()->id,
                'action' => 'LEASE_TERMINATED',
                'entity_type' => 'Lease',
                'entity_id' => $lease->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'TERMINATED'],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Kontrak {$lease->lease_number} berhasil diakhiri dan unit kembali AVAILABLE.",
                'data' => $lease->fresh(['unit.property', 'tenant']),
            ]);
        });
    }

    public function renew(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'end_date' => ['required', 'date'],
            'rental_price' => ['sometimes', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $lease = Lease::lockForUpdate()->findOrFail($id);
            $oldEnd = $lease->end_date->format('Y-m-d');
            $oldPrice = $lease->rental_price;

            $lease->update([
                'end_date' => $validated['end_date'],
                'rental_price' => $validated['rental_price'] ?? $lease->rental_price,
                'status' => 'ACTIVE',
            ]);

            AuditLog::create([
                'organization_id' => TenantContext::get(),
                'actor_user_id' => $request->user()->id,
                'action' => 'LEASE_RENEWED',
                'entity_type' => 'Lease',
                'entity_id' => $lease->id,
                'old_values' => ['end_date' => $oldEnd, 'rental_price' => $oldPrice],
                'new_values' => [
                    'end_date' => $lease->end_date->format('Y-m-d'),
                    'rental_price' => $lease->rental_price,
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Kontrak {$lease->lease_number} berhasil diperpanjang hingga {$validated['end_date']}.",
                'data' => $lease->fresh(['unit.property', 'tenant']),
            ]);
        });
    }

    public function show(string $id): JsonResponse
    {
        $lease = Lease::with(['unit.property', 'tenant', 'invoices.items'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail kontrak sewa berhasil diambil.',
            'data' => $lease,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $lease = Lease::findOrFail($id);

        $validated = $request->validate([
            'due_day' => ['sometimes', 'integer', 'min:1', 'max:28'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'terms' => ['nullable', 'string'],
        ]);

        $lease->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Ketentuan kontrak sewa berhasil diperbarui.',
            'data' => $lease->fresh(['unit.property', 'tenant']),
        ]);
    }
}
