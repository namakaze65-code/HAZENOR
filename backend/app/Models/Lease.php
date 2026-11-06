<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lease extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'unit_id',
        'tenant_id',
        'lease_number',
        'start_date',
        'end_date',
        'rental_price',
        'billing_cycle',
        'due_day',
        'deposit_amount',
        'status',
        'terms',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'rental_price' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
        ];
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'lease_id');
    }
}
