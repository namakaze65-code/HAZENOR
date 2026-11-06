<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'property_id',
        'unit_number',
        'floor_number',
        'area_sqm',
        'rental_price',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'area_sqm' => 'decimal:2',
            'rental_price' => 'decimal:2',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function leases(): HasMany
    {
        return $this->hasMany(Lease::class, 'unit_id');
    }
}
