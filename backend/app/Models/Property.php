<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'address',
        'city',
        'province',
        'postal_code',
        'description',
        'status',
    ];

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class, 'property_id');
    }
}
