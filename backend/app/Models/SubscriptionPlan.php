<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'code',
        'name',
        'price',
        'billing_period',
        'max_units',
        'max_members',
        'monthly_whatsapp_quota',
        'features',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'features' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
