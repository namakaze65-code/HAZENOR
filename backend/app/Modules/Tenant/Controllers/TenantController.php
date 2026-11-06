<?php

namespace App\Modules\Tenant\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index(): JsonResponse
    {
        $tenants = Tenant::latest()->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar penyewa berhasil diambil.',
            'data' => $tenants->items(),
            'meta' => [
                'current_page' => $tenants->currentPage(),
                'per_page' => $tenants->perPage(),
                'total' => $tenants->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'identity_number' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
        ]);

        $tenant = Tenant::create([
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'identity_number_encrypted' => $validated['identity_number'] ?? null,
            'address' => $validated['address'] ?? null,
            'status' => 'ACTIVE',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profil penyewa berhasil dibuat.',
            'data' => $tenant,
        ], 201);
    }

    public function invite(Request $request, string $tenantId): JsonResponse
    {
        $tenant = Tenant::findOrFail($tenantId);

        $rawToken = Str::random(48);
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = now()->addHours(48);

        DB::table('tenant_invitations')->insert([
            'id' => (string) Str::uuid(),
            'organization_id' => TenantContext::get(),
            'tenant_id' => $tenant->id,
            'destination' => $tenant->email ?: $tenant->phone,
            'token_hash' => $tokenHash,
            'expires_at' => $expiresAt,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Undangan penyewa berhasil dibuat (berlaku 48 jam).',
            'data' => [
                'invitation_token' => $rawToken,
                'expires_at' => $expiresAt->toIso8601String(),
            ],
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $tenant = Tenant::with('leases.unit.property')->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail penyewa berhasil diambil.',
            'data' => $tenant,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'full_name' => ['sometimes', 'string', 'max:150'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil penyewa berhasil diperbarui.',
            'data' => $tenant,
        ]);
    }
}
