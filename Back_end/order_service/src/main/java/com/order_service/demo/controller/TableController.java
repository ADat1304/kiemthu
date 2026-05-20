package com.order_service.demo.controller;

import com.order_service.demo.common.ApiResponse;
import com.order_service.demo.dto.request.TableStatusUpdateRequest;
import com.order_service.demo.dto.response.CafeTableResponse;
import com.order_service.demo.service.TableService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tables")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TableController {

    TableService tableService;

    @GetMapping
    public ApiResponse<List<CafeTableResponse>> getTables() {
        List<CafeTableResponse> tables = tableService.getAllTables();
        return ApiResponse.<List<CafeTableResponse>>builder()
                .result(tables)
                .build();
    }

    @PatchMapping("/{tableNumber}/status")
    public ApiResponse<CafeTableResponse> updateStatus(@PathVariable String tableNumber,
                                                       @Valid @RequestBody TableStatusUpdateRequest request) {
        CafeTableResponse response = tableService.updateStatus(tableNumber, request.getStatus());
        return ApiResponse.<CafeTableResponse>builder()
                .result(response)
                .build();
    }
}
