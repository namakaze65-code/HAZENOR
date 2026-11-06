<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'destination_bank_account_id',
        'payment_number',
        'amount',
        'method',
        'provider',
        'provider_reference',
        'status',
        'paid_at',
        'verified_at',
        'verified_by',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
            'verified_at' => 'datetime',
        ];
    }

    public function destinationBankAccount(): BelongsTo
    {
        return $this->belongsTo(OrganizationBankAccount::class, 'destination_bank_account_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'payment_id');
    }
}
