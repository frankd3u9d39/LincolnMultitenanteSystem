<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * GROUP 4: SuperAdmin Module - key/value platform configuration.
 *
 * Values live in a text column and are coerced on read according to
 * `data_type`, so callers get a real bool/int/array rather than a string.
 */
class PlatformSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'key_name',
        'display_name',
        'value',
        'data_type',
        'description',
        'is_encrypted',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_encrypted' => 'boolean',
            'is_public' => 'boolean',
        ];
    }

    /** The stored value, coerced to the type this setting declares. */
    public function getTypedValueAttribute(): mixed
    {
        return match ($this->data_type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'json' => json_decode((string) $this->value, true) ?? [],
            default => $this->value,
        };
    }

    /** Serialises a PHP value into the text column using the declared type. */
    public function setTypedValue(mixed $value): void
    {
        $this->value = match ($this->data_type) {
            'boolean' => $value ? '1' : '0',
            'integer' => (string) (int) $value,
            'json' => json_encode($value),
            default => (string) $value,
        };
    }
}
