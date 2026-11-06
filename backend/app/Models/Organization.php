<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'slug',
        'owner_user_id',
        'status',
        'timezone',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(OrganizationBankAccount::class, 'organization_id');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'organization_id');
    }
}
