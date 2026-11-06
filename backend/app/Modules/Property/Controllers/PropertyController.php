<?php

namespace App\Modules\Property\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\Property;
use App\Models\Unit;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function index(): JsonResponse
    {
        $properties = Property::withCount('units')->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Properties retrieved successfully',
            'data' => $properties->items(),
            'meta' => [
                'current_page' => $properties->currentPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'address' => ['required', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:15'],
            'description' => ['nullable', 'string'],
        ]);

        $property = Property::create(array_merge($validated, ['status' => 'ACTIVE']));

        return response()->json([
            'success' => true,
            'message' => 'Properti berhasil dibuat.',
            'data' => $property,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $property = Property::with('units')->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail properti berhasil diambil.',
            'data' => $property,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $property = Property::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'address' => ['sometimes', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:15'],
            'description' => ['nullable', 'string'],
        ]);

        $property->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data properti berhasil diperbarui.',
            'data' => $property->fresh('units'),
        ]);
    }

    public function archive(string $id): JsonResponse
    {
        $property = Property::findOrFail($id);
        $property->update(['status' => 'ARCHIVED']);

        return response()->json([
            'success' => true,
            'message' => 'Properti berhasil diarsipkan.',
            'data' => $property,
        ]);
    }

    public function units(string $propertyId): JsonResponse
    {
        $property = Property::findOrFail($propertyId);
        $units = Unit::where('property_id', $property->id)->orderBy('unit_number')->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar unit properti berhasil diambil.',
            'data' => $units,
        ]);
    }

    public function storeUnit(Request $request, string $propertyId): JsonResponse
    {
        $property = Property::findOrFail($propertyId);

        // Enforce Subscription Plan max_units limit (SUB-02)
        $org = Organization::with('subscriptions.plan')->find(TenantContext::get());
        $activePlan = $org?->subscriptions?->first()?->plan;
        if ($activePlan && $activePlan->max_units !== null) {
            $currentUnitsCount = Unit::count();
            if ($currentUnitsCount >= $activePlan->max_units) {
                return response()->json([
                    'success' => false,
                    'message' => "Batas jumlah unit untuk paket {$activePlan->name} ({$activePlan->max_units} unit) telah tercapai. Silakan tingkatkan paket berlangganan Anda.",
                ], 422);
            }
        }

        $validated = $request->validate([
            'unit_number' => ['required', 'string', 'max:50'],
            'floor_number' => ['nullable', 'integer'],
            'area_sqm' => ['nullable', 'numeric', 'min:0'],
            'rental_price' => ['required', 'numeric', 'min:0'],
        ]);

        $exists = Unit::where('property_id', $property->id)
            ->where('unit_number', $validated['unit_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor unit sudah digunakan pada properti ini.',
                'errors' => [
                    'unit_number' => ['Nomor unit harus unik dalam satu properti.'],
                ],
            ], 422);
        }

        $unit = Unit::create([
            'property_id' => $property->id,
            'unit_number' => $validated['unit_number'],
            'floor_number' => $validated['floor_number'] ?? null,
            'area_sqm' => $validated['area_sqm'] ?? null,
            'rental_price' => $validated['rental_price'],
            'status' => 'AVAILABLE',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Unit berhasil ditambahkan.',
            'data' => $unit,
        ], 201);
    }
}
