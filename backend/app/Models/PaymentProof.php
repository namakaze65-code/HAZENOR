<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PaymentProof extends Model
{
    use BelongsToOrganization, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'payment_id',
        'storage_key',
        'original_filename',
        'mime_type',
        'size_bytes',
        'uploaded_by',
    ];
}
