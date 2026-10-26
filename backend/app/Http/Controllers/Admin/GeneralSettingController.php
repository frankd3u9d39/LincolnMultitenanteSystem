<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * GROUP 3: Admin Module - General School Configuration, Branding, and Academic Preferences.
 */
class GeneralSettingController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $settings = [
            'academic' => [
                'gradingScale' => '4.0 Scale (Standard US / UK Higher Ed)',
                'minimumPassGrade' => 'C (60%)',
                'minAttendanceThreshold' => 75,
                'maxCourseLoadCredits' => 24,
                'allowSelfCourseDrop' => true,
            ],
            'financial' => [
                'currency' => $school->currency ?? 'NGN (₦)',
                'lateFeeGracePeriodDays' => 14,
                'allowPartialFeePayments' => true,
                'automaticPaymentReceipts' => true,
            ],
            'notifications' => [
                'emailAnnouncements' => true,
                'smsAttendanceAlerts' => true,
                'examReminderDaysBefore' => 3,
            ],
            'portalBranding' => [
                'schoolName' => $school->name,
                'campusCode' => $school->code,
                'logoUrl' => $school->logo_url,
                'primaryColor' => $school->primary_color ?? '#B81D22',
                'secondaryColor' => $school->secondary_color ?? '#9E1519',
                'accentColor' => $school->accent_color ?? '#B81D22',
                'themePalette' => $school->theme_palette ?? 'crimson',
                'portalTheme' => $school->theme_palette ?? 'Lincoln Crimson (#B81D22)',
            ],
        ];

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'minAttendanceThreshold' => ['nullable', 'integer', 'min:50', 'max:100'],
            'maxCourseLoadCredits' => ['nullable', 'integer', 'min:12', 'max:36'],
            'lateFeeGracePeriodDays' => ['nullable', 'integer', 'min:0', 'max:60'],
            'allowSelfCourseDrop' => ['nullable', 'boolean'],
            'allowPartialFeePayments' => ['nullable', 'boolean'],
            'primaryColor' => ['nullable', 'string', 'max:30'],
            'secondaryColor' => ['nullable', 'string', 'max:30'],
            'accentColor' => ['nullable', 'string', 'max:30'],
            'themePalette' => ['nullable', 'string', 'max:50'],
            'logoUrl' => ['nullable', 'string'],
        ]);

        if (isset($data['primaryColor'])) {
            $school->primary_color = $data['primaryColor'];
        }
        if (isset($data['secondaryColor'])) {
            $school->secondary_color = $data['secondaryColor'];
        }
        if (isset($data['accentColor'])) {
            $school->accent_color = $data['accentColor'];
        }
        if (isset($data['themePalette'])) {
            $school->theme_palette = $data['themePalette'];
        }
        if (array_key_exists('logoUrl', $data)) {
            $school->logo_url = $data['logoUrl'];
        }

        $school->save();

        return response()->json([
            'message' => 'Institutional settings and branding updated successfully.',
            'data' => [
                ...$data,
                'portalBranding' => [
                    'schoolName' => $school->name,
                    'campusCode' => $school->code,
                    'logoUrl' => $school->logo_url,
                    'primaryColor' => $school->primary_color,
                    'secondaryColor' => $school->secondary_color,
                    'accentColor' => $school->accent_color,
                    'themePalette' => $school->theme_palette,
                ],
            ],
        ]);
    }

    /**
     * Upload or update school logo file.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:5120'],
        ]);

        $school = $request->user()->school;
        $file = $request->file('logo');
        $extension = $file->getClientOriginalExtension() ?: 'png';
        $filename = 'logo_'.Str::slug($school->code).'_'.time().'.'.$extension;

        $targetDir = public_path('uploads/logos');
        if (! file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $file->move($targetDir, $filename);
        $school->logo_url = '/uploads/logos/'.$filename;
        $school->save();

        return response()->json([
            'status' => 'success',
            'message' => 'School logo successfully uploaded and updated!',
            'data' => [
                'logoUrl' => $school->logo_url,
            ],
        ]);
    }

    /**
     * Delete or reset school logo to default.
     */
    public function deleteLogo(Request $request): JsonResponse
    {
        $school = $request->user()->school;
        $school->logo_url = null;
        $school->save();

        return response()->json([
            'status' => 'success',
            'message' => 'School logo removed. System default logo will now be displayed.',
            'data' => [
                'logoUrl' => null,
            ],
        ]);
    }

    /**
     * Update school branding colors and theme palette directly.
     */
    public function updateBranding(Request $request): JsonResponse
    {
        $request->validate([
            'primaryColor' => ['required', 'string', 'max:30'],
            'secondaryColor' => ['nullable', 'string', 'max:30'],
            'accentColor' => ['nullable', 'string', 'max:30'],
            'themePalette' => ['nullable', 'string', 'max:50'],
            'logoUrl' => ['nullable', 'string'],
        ]);

        $school = $request->user()->school;
        $school->primary_color = $request->string('primaryColor')->toString();
        $school->secondary_color = $request->input('secondaryColor', $request->input('primaryColor'));
        $school->accent_color = $request->input('accentColor', $request->input('primaryColor'));
        if ($request->has('themePalette')) {
            $school->theme_palette = $request->string('themePalette')->toString();
        }
        if ($request->has('logoUrl')) {
            $school->logo_url = $request->input('logoUrl');
        }
        $school->save();

        return response()->json([
            'status' => 'success',
            'message' => 'School brand colors and theme palette updated successfully!',
            'data' => [
                'schoolName' => $school->name,
                'campusCode' => $school->code,
                'logoUrl' => $school->logo_url,
                'primaryColor' => $school->primary_color,
                'secondaryColor' => $school->secondary_color,
                'accentColor' => $school->accent_color,
                'themePalette' => $school->theme_palette,
            ],
        ]);
    }
}
