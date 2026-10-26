<?php

declare(strict_types=1);

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\FeeItem;
use App\Models\FeePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * GROUP 1: Student Module - fee balances and payments.
 *
 * There is no real payment gateway integrated; `pay()` records the payment as
 * a ledger entry the same way a successful gateway callback would, which is
 * enough to drive the UI honestly without pretending to move real money.
 */
class FeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $items = FeeItem::where('student_id', $student->id)->orderBy('due_date')->get();
        $payments = FeePayment::where('student_id', $student->id)->orderByDesc('paid_at')->limit(10)->get();

        $totalDue = $items->sum(fn (FeeItem $i) => $i->outstanding());
        $totalPaid = $payments->sum('amount');

        return response()->json([
            'data' => [
                'summary' => [
                    'totalDue' => round($totalDue, 2),
                    'totalPaid' => round((float) $totalPaid, 2),
                    'dueDate' => $items->where(fn (FeeItem $i) => $i->outstanding() > 0)->min('due_date'),
                    'term' => $items->first()?->term,
                ],
                'breakdown' => $items->map(fn (FeeItem $i) => [
                    'id' => $i->id,
                    'description' => $i->description,
                    'amount' => (float) $i->amount,
                    'status' => $i->status(),
                    'paid' => (float) $i->paid_amount,
                    'due' => $i->outstanding(),
                ]),
                'paymentHistory' => $payments->map(fn (FeePayment $p) => [
                    'id' => $p->id,
                    'date' => $p->paid_at->toDateString(),
                    'method' => $p->method,
                    'amount' => (float) $p->amount,
                    'receipt' => $p->receipt_number,
                ]),
            ],
        ]);
    }

    public function outstanding(Request $request): JsonResponse
    {
        $student = $request->user();

        $items = FeeItem::where('student_id', $student->id)
            ->get()
            ->filter(fn (FeeItem $i) => $i->outstanding() > 0)
            ->map(fn (FeeItem $i) => [
                'id' => $i->id,
                'description' => $i->description,
                'due' => $i->outstanding(),
                'required' => $i->required,
            ])->values();

        return response()->json(['data' => $items]);
    }

    public function pay(Request $request): JsonResponse
    {
        $student = $request->user();

        $data = $request->validate([
            'feeItemIds' => ['required', 'array', 'min:1'],
            'feeItemIds.*' => ['integer'],
            'method' => ['nullable', 'string', 'max:40'],
        ]);

        $items = FeeItem::where('student_id', $student->id)
            ->whereIn('id', $data['feeItemIds'])
            ->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['feeItemIds' => 'No matching fee items were found.']);
        }

        $receipt = DB::transaction(function () use ($items, $student, $data) {
            $total = 0;
            $receiptNumber = '#REC-'.now()->format('ymd').'-'.Str::upper(Str::random(5));

            foreach ($items as $item) {
                $amount = $item->outstanding();

                if ($amount <= 0) {
                    continue;
                }

                $total += $amount;

                FeePayment::create([
                    'school_id' => $student->school_id,
                    'student_id' => $student->id,
                    'fee_item_id' => $item->id,
                    'amount' => $amount,
                    'method' => $data['method'] ?? 'Card',
                    'receipt_number' => $receiptNumber.'-'.$item->id,
                    'paid_at' => now(),
                ]);

                $item->update(['paid_amount' => $item->amount]);
            }

            return ['receipt' => $receiptNumber, 'amount' => $total];
        });

        return response()->json(['data' => $receipt]);
    }
}
