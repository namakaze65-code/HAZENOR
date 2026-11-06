<?php

namespace App\Models\Concerns;

use App\Support\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use RuntimeException;

trait BelongsToOrganization
{
    public static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization_isolation', function (Builder $builder) {
            $orgId = TenantContext::get();
            $table = $builder->getModel()->getTable();

            if ($orgId === null) {
                // Fail-closed: if no organization context is set, return zero rows
                $builder->whereRaw('1 = 0');
                return;
            }

            $builder->where("{$table}.organization_id", $orgId);
        });

        static::creating(function ($model) {
            $orgId = TenantContext::get();
            if (empty($model->organization_id)) {
                if ($orgId === null) {
                    throw new RuntimeException('Cannot create tenant-scoped record without an active Organization Context.');
                }
                $model->organization_id = $orgId;
            } elseif ($orgId !== null && $model->organization_id !== $orgId) {
                throw new RuntimeException('Cross-organization write blocked by TenantContext.');
            }
        });
    }
}
