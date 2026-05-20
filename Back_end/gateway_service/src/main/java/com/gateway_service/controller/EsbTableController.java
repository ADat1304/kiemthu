package com.gateway_service.controller;


import com.gateway_service.client.TableClient;
import com.gateway_service.dto.table.CafeTableResponse;
import com.gateway_service.dto.table.TableStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/esb/tables")
@RequiredArgsConstructor
public class EsbTableController {

    private final TableClient tableClient;

    @GetMapping
    public ResponseEntity<List<CafeTableResponse>> listTables(
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(tableClient.getAllTables(token));
    }

    @PatchMapping("/{tableNumber}/status")
    public ResponseEntity<CafeTableResponse> updateStatus(
            @PathVariable String tableNumber,
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @Valid @RequestBody TableStatusUpdateRequest request
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        CafeTableResponse response = tableClient.updateTableStatus(tableNumber, request.getStatus(), token);
        return ResponseEntity.ok(response);
    }
}