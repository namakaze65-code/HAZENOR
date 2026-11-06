<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillingSchedule extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'lease_id',
        'next_run_date',
        'billing_cycle',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'next_run_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
        ];
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class, 'lease_id');
    }
}
