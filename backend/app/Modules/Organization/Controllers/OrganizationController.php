<?php

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrganizationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $memberships = OrganizationMember::withoutGlobalScope('organization_isolation')
            ->with(['organization.subscriptions.plan', 'role'])
            ->where('user_id', $request->user()->id)
            ->where('status', 'ACTIVE')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar organisasi pengguna berhasil diambil.',
            'data' => $memberships,
        ]);
    }

    public function current(): JsonResponse
    {
        $org = Organization::with(['subscriptions.plan', 'bankAccounts'])
            ->findOrFail(TenantContext::get());

        return response()->json([
            'success' => true,
            'message' => 'Detail organisasi aktif berhasil diambil.',
            'data' => $org,
        ]);
    }

    public function updateCurrent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'timezone' => ['sometimes', 'string', 'max:60'],
            'gateway_provider' => ['nullable', Rule::in(['MIDTRANS', 'XENDIT'])],
            'gateway_merchant_id' => ['nullable', 'string', 'max:150'],
        ]);

        $org = Organization::findOrFail(TenantContext::get());
        $oldValues = ['name' => $org->name, 'timezone' => $org->timezone, 'settings' => $org->settings];

        $settings = $org->settings ?? [];
        if (array_key_exists('gateway_provider', $validated)) {
            $settings['gateway_provider'] = $validated['gateway_provider'];
        }
        if (array_key_exists('gateway_merchant_id', $validated)) {
            $settings['gateway_merchant_id'] = $validated['gateway_merchant_id'];
        }

        $org->update([
            'name' => $validated['name'] ?? $org->name,
            'timezone' => $validated['timezone'] ?? $org->timezone,
            'settings' => $settings,
        ]);

        AuditLog::create([
            'organization_id' => $org->id,
            'actor_user_id' => $request->user()->id,
            'action' => 'ORGANIZATION_UPDATED',
            'entity_type' => 'Organization',
            'entity_id' => $org->id,
            'old_values' => $oldValues,
            'new_values' => ['name' => $org->name, 'timezone' => $org->timezone, 'settings' => $org->settings],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan organisasi berhasil diperbarui.',
            'data' => $org,
        ]);
    }

    public function members(): JsonResponse
    {
        $members = OrganizationMember::with(['user', 'role'])->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar anggota organisasi berhasil diambil.',
            'data' => $members,
        ]);
    }

    public function inviteStaff(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'role_code' => ['required', Rule::in(['ADMIN', 'MANAGER', 'FINANCE', 'STAFF'])],
        ]);

        // Enforce Subscription Plan max_members limit (SUB-02)
        $org = Organization::with('subscriptions.plan')->find(TenantContext::get());
        $activePlan = $org?->subscriptions?->first()?->plan;
        if ($activePlan && $activePlan->max_members !== null) {
            $currentMembersCount = OrganizationMember::where('status', 'ACTIVE')->count();
            if ($currentMembersCount >= $activePlan->max_members) {
                return response()->json([
                    'success' => false,
                    'message' => "Batas jumlah anggota untuk paket {$activePlan->name} ({$activePlan->max_members} pengguna) telah tercapai. Silakan tingkatkan paket berlangganan Anda.",
                ], 422);
            }
        }

        $role = Role::where('code', $validated['role_code'])->firstOrFail();

        return DB::transaction(function () use ($request, $validated, $role) {
            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name' => $validated['name'],
                    'password' => 'password123',
                    'status' => 'ACTIVE',
                ]
            );

            $member = OrganizationMember::updateOrCreate(
                [
                    'organization_id' => TenantContext::get(),
                    'user_id' => $user->id,
                ],
                [
                    'role_id' => $role->id,
                    'status' => 'ACTIVE',
                ]
            );

            $rawToken = Str::random(48);
            DB::table('organization_invitations')->insert([
                'id' => (string) Str::uuid(),
                'organization_id' => TenantContext::get(),
                'email' => $validated['email'],
                'role_id' => $role->id,
                'token_hash' => hash('sha256', $rawToken),
                'expires_at' => now()->addHours(48),
                'accepted_at' => now(),
                'created_by' => $request->user()->id,
                'created_at' => now(),
            ]);

            AuditLog::create([
                'organization_id' => TenantContext::get(),
                'actor_user_id' => $request->user()->id,
                'action' => 'STAFF_MEMBER_ADDED',
                'entity_type' => 'OrganizationMember',
                'entity_id' => $member->id,
                'old_values' => null,
                'new_values' => [
                    'email' => $user->email,
                    'role' => $role->code,
                ],
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Staf {$user->name} berhasil ditambahkan sebagai {$role->code}.",
                'data' => $member->load(['user', 'role']),
            ], 201);
        });
    }

    public function updateMember(Request $request, string $memberId): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE'])],
            'role_code' => ['sometimes', Rule::in(['ADMIN', 'MANAGER', 'FINANCE', 'STAFF'])],
        ]);

        $member = OrganizationMember::with('role')->findOrFail($memberId);
        $oldValues = ['status' => $member->status, 'role' => $member->role?->code];

        if (! empty($validated['role_code'])) {
            $role = Role::where('code', $validated['role_code'])->firstOrFail();
            $member->role_id = $role->id;
        }
        if (! empty($validated['status'])) {
            $member->status = $validated['status'];
        }
        $member->save();

        AuditLog::create([
            'organization_id' => TenantContext::get(),
            'actor_user_id' => $request->user()->id,
            'action' => 'STAFF_MEMBER_UPDATED',
            'entity_type' => 'OrganizationMember',
            'entity_id' => $member->id,
            'old_values' => $oldValues,
            'new_values' => ['status' => $member->status, 'role_id' => $member->role_id],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status/peran anggota berhasil diperbarui.',
            'data' => $member->fresh(['user', 'role']),
        ]);
    }

    public function invitations(): JsonResponse
    {
        $invitations = DB::table('organization_invitations')
            ->where('organization_id', TenantContext::get())
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar undangan staf berhasil diambil.',
            'data' => $invitations,
        ]);
    }

    public function cancelInvitation(string $id): JsonResponse
    {
        $deleted = DB::table('organization_invitations')
            ->where('organization_id', TenantContext::get())
            ->where('id', $id)
            ->delete();

        if (! $deleted) {
            return response()->json([
                'success' => false,
                'message' => 'Undangan tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Undangan staf berhasil dibatalkan.',
        ]);
    }

    public function resetOperationalData(Request $request): JsonResponse
    {
        $orgId = TenantContext::get();

        DB::transaction(function () use ($request, $orgId) {
            DB::table('complaint_messages')->where('organization_id', $orgId)->delete();
            DB::table('complaint_attachments')->where('organization_id', $orgId)->delete();
            DB::table('complaints')->where('organization_id', $orgId)->delete();
            DB::table('payment_proofs')->where('organization_id', $orgId)->delete();
            DB::table('payments')->where('organization_id', $orgId)->delete();
            DB::table('invoice_items')->where('organization_id', $orgId)->delete();
            DB::table('invoices')->where('organization_id', $orgId)->delete();
            DB::table('leases')->where('organization_id', $orgId)->delete();
            DB::table('units')->where('organization_id', $orgId)->delete();
            DB::table('properties')->where('organization_id', $orgId)->delete();
            DB::table('tenant_invitations')->where('organization_id', $orgId)->delete();
            DB::table('tenants')->where('organization_id', $orgId)->delete();

            AuditLog::create([
                'organization_id' => $orgId,
                'actor_user_id' => $request->user()->id,
                'action' => 'OPERATIONAL_DATA_RESET',
                'entity_type' => 'Organization',
                'entity_id' => $orgId,
                'old_values' => null,
                'new_values' => ['reset_to_clean_production' => true],
                'ip_address' => $request->ip(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Seluruh data awal/contoh berhasil dibersihkan. Ruang kerja siap diisi data properti asli Anda.',
        ]);
    }
}
