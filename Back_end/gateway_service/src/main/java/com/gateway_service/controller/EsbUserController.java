package com.gateway_service.controller;

import com.gateway_service.client.UserClient;
import com.gateway_service.dto.user.UserCreationRequest;
import com.gateway_service.dto.user.UserResponse;
import com.gateway_service.dto.user.UserUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/esb/users")
@RequiredArgsConstructor
public class EsbUserController {

    private final UserClient userClient;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody UserCreationRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(userClient.createUser(request, token));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers(
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(userClient.getUsers(token));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable String userId,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(userClient.getUserById(userId, token));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String userId,
            @RequestBody UserUpdateRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        return ResponseEntity.ok(userClient.updateUser(userId, request, token));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String userId,
            @RequestHeader(name = "Authorization", required = false) String authorization
    ) {
        String token = authorization != null ? authorization.replace("Bearer ", "") : null;
        userClient.deleteUser(userId, token);
        return ResponseEntity.noContent().build();
    }
}