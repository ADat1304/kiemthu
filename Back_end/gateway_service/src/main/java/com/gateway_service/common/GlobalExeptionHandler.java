package com.gateway_service.common;


import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@ControllerAdvice
public class GlobalExeptionHandler {

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<ApiResponse<String>> handleRestClient(RestClientResponseException exception) {
        log.error("Service call failed", exception);
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(exception.getRawStatusCode())
                .message(exception.getStatusText())
                .result(exception.getResponseBodyAsString())
                .build();
        return ResponseEntity.status(exception.getRawStatusCode()).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<String>> handleAccessDenied(AccessDeniedException exception) {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(HttpStatus.FORBIDDEN.value())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleUnexpected(Exception exception) {
        log.error("Unexpected error", exception);
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .message(exception.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
