<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'user_id',
        'full_name',
        'phone',
        'email',
        'identity_number_encrypted',
        'address',
        'status',
    ];

    protected $hidden = [
        'identity_number_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'identity_number_encrypted' => 'encrypted',
        ];
    }

    public function leases(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Lease::class, 'tenant_id');
    }
}
