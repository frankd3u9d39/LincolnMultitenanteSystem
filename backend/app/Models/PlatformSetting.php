<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * GROUP 4: SuperAdmin Module - key/value platform configuration.
 *
 * Values live in a text column and are coerced on read according to
 * `data_type`, so callers get a real bool/int/array rather than a string.
 * Settings flagged `is_encrypted` (SMTP passwords and the like) are encrypted
 * at rest and never returned to the browser.
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

    /** Reads one setting by key, falling back when it is missing or unset. */
    public static function valueOf(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key_name', $key)->first();

        return $setting === null || $setting->value === null || $setting->value === ''
            ? $default
            : $setting->typed_value;
    }

    /** Whether any value has been stored (used where the value itself is hidden). */
    public function getHasValueAttribute(): bool
    {
        return $this->value !== null && $this->value !== '';
    }

    /** The stored value, coerced to the type this setting declares. */
    public function getTypedValueAttribute(): mixed
    {
        $raw = $this->value;

        if ($this->is_encrypted && $raw !== null && $raw !== '') {
            try {
                $raw = Crypt::decryptString($raw);
            } catch (\Throwable) {
                return null;
            }
        }

        return match ($this->data_type) {
            'boolean' => filter_var($raw, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $raw,
            'json' => json_decode((string) $raw, true) ?? [],
            default => $raw,
        };
    }

    /** Serialises a PHP value into the text column using the declared type. */
    public function setTypedValue(mixed $value): void
    {
        $stored = match ($this->data_type) {
            'boolean' => $value ? '1' : '0',
            'integer' => (string) (int) $value,
            'json' => json_encode($value),
            default => (string) $value,
        };

        $this->value = $this->is_encrypted && $stored !== '' ? Crypt::encryptString($stored) : $stored;
    }
}
