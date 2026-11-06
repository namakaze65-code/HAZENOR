<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use BelongsToOrganization, HasUuids;

    protected $fillable = [
        'organization_id',
        'lease_id',
        'invoice_number',
        'billing_period_start',
        'billing_period_end',
        'issue_date',
        'due_date',
        'subtotal',
        'discount',
        'tax',
        'total',
        'paid_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'billing_period_start' => 'date:Y-m-d',
            'billing_period_end' => 'date:Y-m-d',
            'issue_date' => 'date:Y-m-d',
            'due_date' => 'date:Y-m-d',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'paid_amount' => 'decimal:2',
        ];
    }

    public function lease(): BelongsTo
    {
        return $this->belongsTo(Lease::class, 'lease_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class, 'invoice_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class, 'invoice_id');
    }
}
