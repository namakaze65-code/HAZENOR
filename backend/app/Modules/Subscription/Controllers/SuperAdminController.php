<?php

namespace App\Modules\Subscription\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $organizations = Organization::with(['owner', 'subscriptions.plan'])
            ->latest()
            ->get();

        $plans = SubscriptionPlan::orderBy('price')->get();
        $auditLogs = AuditLog::orderByDesc('id')->limit(25)->get();

        return response()->json([
            'success' => true,
            'message' => 'Ringkasan platform Super Admin berhasil diambil.',
            'data' => [
                'metrics' => [
                    'total_organizations' => $organizations->count(),
                    'total_users' => User::count(),
                    'active_subscriptions' => Subscription::whereIn('status', ['TRIAL', 'ACTIVE'])->count(),
                ],
                'organizations' => $organizations,
                'plans' => $plans,
                'audit_logs' => $auditLogs,
            ],
        ]);
    }

    public function updateOrganizationStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['ACTIVE', 'SUSPENDED'])],
            'plan_code' => ['sometimes', Rule::in(['STARTER', 'PRO', 'BUSINESS'])],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $org = Organization::with('subscriptions')->findOrFail($id);
        $oldStatus = $org->status;

        if (! empty($validated['status'])) {
            $org->update(['status' => $validated['status']]);
        }

        if (! empty($validated['plan_code'])) {
            $plan = SubscriptionPlan::where('code', $validated['plan_code'])->firstOrFail();
            Subscription::updateOrCreate(
                ['organization_id' => $org->id],
                [
                    'plan_id' => $plan->id,
                    'status' => 'ACTIVE',
                    'starts_at' => now(),
                    'ends_at' => now()->addYear(),
                    'grace_ends_at' => now()->addYear()->addDays(7),
                ]
            );
        }

        AuditLog::create([
            'organization_id' => $org->id,
            'actor_user_id' => null,
            'action' => 'SUPER_ADMIN_ORG_UPDATE',
            'entity_type' => 'Organization',
            'entity_id' => $org->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => [
                'status' => $org->status,
                'plan_code' => $validated['plan_code'] ?? null,
                'reason' => $validated['reason'],
            ],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => "Organisasi {$org->name} berhasil diperbarui dan dicatat di Audit Log Platform.",
            'data' => $org->fresh(['owner', 'subscriptions.plan']),
        ]);
    }

    public function organizations(): JsonResponse
    {
        $organizations = Organization::with(['owner', 'subscriptions.plan'])->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar organisasi platform berhasil diambil.',
            'data' => $organizations->items(),
            'meta' => [
                'current_page' => $organizations->currentPage(),
                'per_page' => $organizations->perPage(),
                'total' => $organizations->total(),
            ],
        ]);
    }

    public function users(): JsonResponse
    {
        $users = User::latest()->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pengguna platform berhasil diambil.',
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function subscriptions(): JsonResponse
    {
        $subscriptions = Subscription::with(['organization', 'plan'])->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar langganan platform berhasil diambil.',
            'data' => $subscriptions->items(),
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ],
        ]);
    }

    public function auditLogs(): JsonResponse
    {
        $logs = AuditLog::orderByDesc('id')->paginate(25);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat audit platform berhasil diambil.',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
