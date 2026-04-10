<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class GeminiController extends Controller
{
    /**
     * Generate recipe JSON content through Gemini using a server-side API key.
     */
    public function generate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'prompt' => 'required|string|min:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $apiKey = trim((string) config('services.gemini.key'));
        if ($apiKey === '') {
            return response()->json([
                'message' => 'Gemini API key is not configured on the server. Set GEMINI_API_KEY in server/.env.',
            ], 500);
        }

        $prompt = (string) $request->input('prompt');
        $models = [
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash-lite-001',
            'gemini-2.0-flash',
            'gemini-flash-latest',
            'gemini-2.5-flash',
        ];

        $lastError = null;
        $lastStatus = 502;
        $maxRetryAfterSeconds = 0;

        foreach ($models as $model) {
            $url = sprintf(
                'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s',
                $model,
                urlencode($apiKey)
            );

            // Retry each model for temporary demand spikes before moving to the next model.
            for ($attempt = 0; $attempt < 3; $attempt++) {
                if ($attempt > 0) {
                    usleep($attempt * 2 * 1000000);
                }

                $response = Http::acceptJson()
                    ->timeout(45)
                    ->post($url, [
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => [
                                    ['text' => $prompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json',
                        ],
                    ]);

                $responseJson = $response->json();
                $rawMessage = strtolower((string) data_get($responseJson, 'error.message', ''));
                $rawStatus = strtoupper((string) data_get($responseJson, 'error.status', ''));
                $isHighDemand = $response->status() === 503
                    || $rawStatus === 'UNAVAILABLE'
                    || str_contains($rawMessage, 'high demand')
                    || str_contains($rawMessage, 'try again later');

                if ($response->status() === 404) {
                    $lastError = $responseJson;
                    $lastStatus = 404;
                    break;
                }

                if ($response->status() === 429) {
                    $lastError = $responseJson;
                    $lastStatus = 429;
                    $retryDelay = (string) data_get($lastError, 'error.details.2.retryDelay', '0s');
                    if (preg_match('/(\d+)/', $retryDelay, $matches) === 1) {
                        $maxRetryAfterSeconds = max($maxRetryAfterSeconds, (int) $matches[1]);
                    }
                    if ($attempt < 2) {
                        continue;
                    }
                    break;
                }

                if ($isHighDemand) {
                    $lastError = $responseJson;
                    $lastStatus = 503;
                    $maxRetryAfterSeconds = max($maxRetryAfterSeconds, 30);
                    if ($attempt < 2) {
                        continue;
                    }
                    break;
                }

                if ($response->status() === 403) {
                    return response()->json([
                        'message' => 'Gemini request rejected by Google (403).',
                        'error' => $responseJson,
                    ], 403);
                }

                if (!$response->successful()) {
                    $lastError = $responseJson;
                    $lastStatus = $response->status() > 0 ? $response->status() : 502;
                    break;
                }

                $text = data_get($responseJson, 'candidates.0.content.parts.0.text');
                if (is_string($text) && trim($text) !== '') {
                    return response()->json([
                        'text' => $text,
                        'model' => $model,
                    ], 200);
                }

                $lastError = [
                    'message' => 'Gemini returned an empty response payload.',
                    'raw' => $responseJson,
                ];
                $lastStatus = 502;
                break;
            }
        }

        if ($lastStatus === 429) {
            return response()->json([
                'message' => 'Gemini rate limit reached (429).',
                'retry_after_seconds' => $maxRetryAfterSeconds > 0 ? $maxRetryAfterSeconds : 30,
                'error' => $lastError,
            ], 429);
        }

        if ($lastStatus === 503) {
            return response()->json([
                'message' => 'Gemini is experiencing high demand. Please try again later.',
                'retry_after_seconds' => $maxRetryAfterSeconds > 0 ? $maxRetryAfterSeconds : 30,
                'error' => $lastError,
            ], 503);
        }

        return response()->json([
            'message' => 'Failed to generate content from Gemini with available models.',
            'error' => $lastError,
        ], $lastStatus);
    }
}
