<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Complaint extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'tenant_id',
        'unit_id',
        'ticket_number',
        'title',
        'description',
        'category',
        'priority',
        'status',
        'assigned_to',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'resolved_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ComplaintMessage::class, 'complaint_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(ComplaintStatusHistory::class, 'complaint_id');
    }
}
