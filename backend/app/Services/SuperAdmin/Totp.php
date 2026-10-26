<?php

declare(strict_types=1);

namespace App\Services\SuperAdmin;

/**
 * GROUP 4: SuperAdmin Module - RFC 6238 time-based one-time passwords.
 *
 * Compatible with Google Authenticator, Authy and 1Password: SHA-1, six
 * digits, 30 second step, base32 secrets.
 */
class Totp
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    private const STEP_SECONDS = 30;

    private const DIGITS = 6;

    /** A fresh 160-bit secret, base32 encoded. */
    public function generateSecret(): string
    {
        return $this->base32Encode(random_bytes(20));
    }

    /** The otpauth:// URI authenticator apps import from a QR code. */
    public function provisioningUri(string $secret, string $account, string $issuer): string
    {
        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d',
            rawurlencode($issuer),
            rawurlencode($account),
            $secret,
            rawurlencode($issuer),
            self::DIGITS,
            self::STEP_SECONDS
        );
    }

    /** Code for the given secret at a moment in time (defaults to now). */
    public function code(string $secret, ?int $timestamp = null): string
    {
        $counter = intdiv($timestamp ?? time(), self::STEP_SECONDS);
        $hash = hash_hmac('sha1', pack('J', $counter), $this->base32Decode($secret), true);

        $offset = ord($hash[19]) & 0x0F;
        $binary = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        return str_pad((string) ($binary % (10 ** self::DIGITS)), self::DIGITS, '0', STR_PAD_LEFT);
    }

    /** Accepts the current step plus or minus one, to tolerate clock drift. */
    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';

        if (! preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $now = time();

        for ($offset = -$window; $offset <= $window; $offset++) {
            if (hash_equals($this->code($secret, $now + ($offset * self::STEP_SECONDS)), $code)) {
                return true;
            }
        }

        return false;
    }

    private function base32Encode(string $bytes): string
    {
        $bits = '';
        foreach (str_split($bytes) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }

        $encoded = '';
        foreach (str_split($bits, 5) as $chunk) {
            $encoded .= self::ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

        return $encoded;
    }

    private function base32Decode(string $secret): string
    {
        $bits = '';
        foreach (str_split(strtoupper(rtrim($secret, '='))) as $char) {
            $position = strpos(self::ALPHABET, $char);
            if ($position === false) {
                continue;
            }
            $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $bytes .= chr(bindec($chunk));
            }
        }

        return $bytes;
    }
}
