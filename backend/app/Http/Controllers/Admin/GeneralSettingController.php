<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GROUP 3: Admin Module - General School Configuration and Academic Preferences.
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
                'currency' => 'NGN (₦)',
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
                'portalTheme' => 'Lincoln Crimson (#B81D22)',
            ],
        ];

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'minAttendanceThreshold' => ['nullable', 'integer', 'min:50', 'max:100'],
            'maxCourseLoadCredits' => ['nullable', 'integer', 'min:12', 'max:36'],
            'lateFeeGracePeriodDays' => ['nullable', 'integer', 'min:0', 'max:60'],
            'allowSelfCourseDrop' => ['nullable', 'boolean'],
            'allowPartialFeePayments' => ['nullable', 'boolean'],
        ]);

        return response()->json([
            'message' => 'Institutional settings updated successfully.',
            'data' => $data,
        ]);
    }
}
