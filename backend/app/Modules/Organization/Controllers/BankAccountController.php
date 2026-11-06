<?php

namespace App\Modules\Organization\Controllers;

use App\Http\Controllers\Controller;
use App\Models\OrganizationBankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = OrganizationBankAccount::orderByDesc('is_primary')
            ->orderBy('bank_name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar rekening bank organisasi berhasil diambil.',
            'data' => $accounts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_holder_name' => ['required', 'string', 'max:150'],
            'is_primary' => ['sometimes', 'boolean'],
        ]);

        if (! empty($validated['is_primary'])) {
            OrganizationBankAccount::query()->update(['is_primary' => false]);
        }

        $account = OrganizationBankAccount::create([
            'bank_name' => $validated['bank_name'],
            'account_number' => $validated['account_number'],
            'account_holder_name' => $validated['account_holder_name'],
            'is_primary' => $validated['is_primary'] ?? false,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Rekening bank berhasil ditambahkan.',
            'data' => $account,
        ], 201);
    }
}
