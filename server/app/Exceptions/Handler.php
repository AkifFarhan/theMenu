<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Throwable $exception
     * @return \Illuminate\Http\JsonResponse|\Symfony\Component\HttpFoundation\Response
     */
    public function render($request, Throwable $exception)
    {
        if (!$request->expectsJson() && !$request->is('api/*')) {
            return parent::render($request, $exception);
        }

        $status = $this->getStatusCode($exception);
        $message = $this->getMessage($exception);

        return response()->json([
            'success' => false,
            'message' => $message,
        ], $status);
    }



    /**
     * Get the error message from the exception.
     *
     * @param \Throwable $exception
     * @return string
     */
    protected function getMessage(Throwable $exception): string
    {
        if ($exception instanceof ValidationException) {
            return $exception->getMessage() ?: 'Validation failed.';
        }

        if ($exception instanceof ModelNotFoundException) {
            return 'Resource not found.';
        }

        if ($exception instanceof AuthenticationException) {
            return 'Unauthenticated.';
        }

        if (!$this->container->has('config') || !$this->container['config']->get('app.debug', false)) {
            return 'An unexpected error occurred.';
        }

        return $exception->getMessage() ?: 'An unexpected error occurred.';
    }

    /**
     * Get an HTTP status code for a known exception type.
     */
    protected function getStatusCode(Throwable $exception): int
    {
        if ($exception instanceof ValidationException) {
            return 422;
        }

        if ($exception instanceof AuthenticationException) {
            return 401;
        }

        if ($exception instanceof ModelNotFoundException) {
            return 404;
        }

        if ($exception instanceof HttpExceptionInterface) {
            return $exception->getStatusCode();
        }

        return 500;
    }

}
