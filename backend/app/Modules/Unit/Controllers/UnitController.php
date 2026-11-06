<?php

namespace App\Modules\Unit\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    public function index(): JsonResponse
    {
        $units = Unit::with('property')->orderBy('unit_number')->paginate(50);

        return response()->json([
            'success' => true,
            'message' => 'Daftar unit berhasil diambil.',
            'data' => $units->items(),
            'meta' => [
                'current_page' => $units->currentPage(),
                'per_page' => $units->perPage(),
                'total' => $units->total(),
            ],
        ]);
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE', 'INACTIVE'])],
        ]);

        $unit = Unit::findOrFail($id);
        $unit->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status unit berhasil diperbarui.',
            'data' => $unit,
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $unit = Unit::with(['property', 'leases'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail unit berhasil diambil.',
            'data' => $unit,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $unit = Unit::findOrFail($id);

        $validated = $request->validate([
            'unit_number' => ['sometimes', 'string', 'max:50'],
            'floor_number' => ['nullable', 'integer'],
            'area_sqm' => ['nullable', 'numeric', 'min:0'],
            'rental_price' => ['sometimes', 'numeric', 'min:0'],
        ]);

        // UNIT-05 & LEASE-05: Updating unit rental_price only updates the unit catalog price;
        // active leases keep their own snapshot rental_price.
        $unit->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data unit berhasil diperbarui (harga kontrak yang sedang berjalan tetap dipertahankan).',
            'data' => $unit->fresh('property'),
        ]);
    }
}
