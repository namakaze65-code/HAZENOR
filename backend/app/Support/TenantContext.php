<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class TenantContext
{
    private static ?string $organizationId = null;
    private static ?string $roleCode = null;

    public static function set(?string $organizationId, ?string $roleCode = null): void
    {
        self::$organizationId = $organizationId;
        self::$roleCode = $roleCode;

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement(
                "SELECT set_config('app.current_organization_id', ?, false)",
                [$organizationId ?? '']
            );
        }
    }

    public static function get(): ?string
    {
        return self::$organizationId;
    }

    public static function role(): ?string
    {
        return self::$roleCode;
    }

    public static function clear(): void
    {
        self::set(null, null);
    }
}
