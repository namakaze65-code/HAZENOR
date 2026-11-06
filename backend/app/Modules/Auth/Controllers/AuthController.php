<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'organization_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $validated['password'],
                'status' => 'ACTIVE',
            ]);

            $ownerRole = Role::firstOrCreate(
                ['code' => 'OWNER'],
                ['name' => 'Owner']
            );

            $slug = Str::slug($validated['organization_name']).'-'.Str::lower(Str::random(6));
            $organization = Organization::create([
                'name' => $validated['organization_name'],
                'slug' => $slug,
                'owner_user_id' => $user->id,
                'status' => 'ACTIVE',
                'timezone' => 'Asia/Jakarta',
                'settings' => [],
            ]);

            TenantContext::set($organization->id, 'OWNER');

            OrganizationMember::create([
                'organization_id' => $organization->id,
                'user_id' => $user->id,
                'role_id' => $ownerRole->id,
                'status' => 'ACTIVE',
            ]);

            $starterPlan = SubscriptionPlan::firstOrCreate(
                ['code' => 'STARTER'],
                [
                    'name' => 'Starter / Trial',
                    'price' => 0,
                    'billing_period' => 'MONTHLY',
                    'max_units' => 5,
                    'max_members' => 2,
                    'monthly_whatsapp_quota' => 100,
                    'features' => ['manual_payment' => true],
                    'is_active' => true,
                ]
            );

            Subscription::create([
                'organization_id' => $organization->id,
                'plan_id' => $starterPlan->id,
                'status' => 'TRIAL',
                'starts_at' => now(),
                'ends_at' => now()->addDays(14),
                'grace_ends_at' => now()->addDays(21),
            ]);

            $token = $user->createToken('ruko360-web')->plainTextToken;
            TenantContext::clear();

            return response()->json([
                'success' => true,
                'message' => 'Registrasi Owner dan Organisasi berhasil.',
                'data' => [
                    'token' => $token,
                    'user' => $user,
                    'active_organization' => $organization,
                ],
            ], 201);
        });
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password tidak sesuai.',
            ], 401);
        }

        $memberships = OrganizationMember::withoutGlobalScope('organization_isolation')
            ->with(['organization', 'role'])
            ->where('user_id', $user->id)
            ->where('status', 'ACTIVE')
            ->get();

        $organizations = $memberships->map(fn ($m) => [
            'id' => $m->organization->id,
            'name' => $m->organization->name,
            'slug' => $m->organization->slug,
            'role' => $m->role?->code,
        ])->values();

        // Tenant (penyewa) accounts are linked through tenant_user_links instead of memberships
        $tenantOrganizations = DB::table('tenant_user_links')
            ->join('organizations', 'organizations.id', '=', 'tenant_user_links.organization_id')
            ->where('tenant_user_links.user_id', $user->id)
            ->get(['organizations.id', 'organizations.name', 'organizations.slug'])
            ->map(fn ($o) => [
                'id' => $o->id,
                'name' => $o->name,
                'slug' => $o->slug,
                'role' => 'TENANT',
            ]);

        $organizations = $organizations->concat($tenantOrganizations)->unique('id')->values();

        // Which portal the frontend should open after login
        $firstRole = $organizations->first()['role'] ?? null;
        $portal = $user->is_super_admin && $organizations->isEmpty()
            ? 'super-admin'
            : ($firstRole === 'TENANT' ? 'tenant' : ($firstRole ? 'owner' : ($user->is_super_admin ? 'super-admin' : null)));

        $token = $user->createToken('ruko360-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => $user,
                'is_super_admin' => (bool) $user->is_super_admin,
                'portal' => $portal,
                'active_organization' => $organizations->first(),
                'organizations' => $organizations,
            ],
        ]);
    }

    public function acceptInvitation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $tokenHash = hash('sha256', $validated['token']);

        $invitation = DB::table('tenant_invitations')
            ->where('token_hash', $tokenHash)
            ->whereNull('accepted_at')
            ->whereNull('revoked_at')
            ->first();

        if (! $invitation || now()->greaterThan($invitation->expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Token undangan tidak valid, sudah digunakan, atau sudah kedaluwarsa (48 jam).',
            ], 422);
        }

        return DB::transaction(function () use ($validated, $invitation) {
            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name' => $validated['name'],
                    'password' => $validated['password'],
                    'status' => 'ACTIVE',
                ]
            );

            TenantContext::set($invitation->organization_id, 'TENANT');

            $tenant = Tenant::findOrFail($invitation->tenant_id);
            $tenant->update(['user_id' => $user->id]);

            DB::table('tenant_user_links')->updateOrInsert(
                [
                    'organization_id' => $invitation->organization_id,
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                ],
                [
                    'id' => (string) Str::uuid(),
                    'verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            DB::table('tenant_invitations')
                ->where('id', $invitation->id)
                ->update(['accepted_at' => now()]);

            TenantContext::clear();

            return response()->json([
                'success' => true,
                'message' => 'Undangan berhasil diterima dan akun penyewa telah terhubung.',
                'data' => [
                    'user' => $user,
                    'tenant_id' => $tenant->id,
                    'organization_id' => $invitation->organization_id,
                ],
            ]);
        });
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Profil pengguna berhasil diambil.',
            'data' => [
                'user' => $user,
                'active_organization_id' => TenantContext::get(),
                'active_role' => TenantContext::role(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
            'data' => null,
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $rawToken = Str::random(48);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $validated['email']],
            [
                'token' => hash('sha256', $rawToken),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Tautan pengaturan ulang kata sandi telah dikirim ke email Anda.',
            'data' => [
                'reset_token' => $rawToken,
            ],
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $record = DB::table('password_reset_tokens')
            ->where('email', $validated['email'])
            ->where('token', hash('sha256', $validated['token']))
            ->first();

        if (! $record) {
            return response()->json([
                'success' => false,
                'message' => 'Token pengaturan ulang kata sandi tidak valid atau sudah kedaluwarsa.',
            ], 422);
        }

        $user = User::where('email', $validated['email'])->firstOrFail();
        $user->update(['password' => $validated['password']]);

        DB::table('password_reset_tokens')->where('email', $validated['email'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru.',
        ]);
    }

    public function switchOrganization(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'organization_id' => ['required', 'uuid'],
        ]);

        $membership = OrganizationMember::withoutGlobalScope('organization_isolation')
            ->with(['organization', 'role'])
            ->where('user_id', $request->user()->id)
            ->where('organization_id', $validated['organization_id'])
            ->where('status', 'ACTIVE')
            ->first();

        if (! $membership) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses aktif ke organisasi tersebut.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => "Organisasi aktif berhasil dialihkan ke {$membership->organization->name}.",
            'data' => [
                'active_organization' => [
                    'id' => $membership->organization->id,
                    'name' => $membership->organization->name,
                    'slug' => $membership->organization->slug,
                    'role' => $membership->role?->code,
                ],
            ],
        ]);
    }
}
