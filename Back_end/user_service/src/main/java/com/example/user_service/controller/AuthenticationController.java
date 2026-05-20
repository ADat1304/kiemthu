package com.example.user_service.controller;



import com.example.user_service.common.ApiResponse;
import com.example.user_service.dto.request.AuthenticationRequest;
import com.example.user_service.dto.request.IntrospectRequest;
import com.example.user_service.dto.response.AuthenticationReponse;
import com.example.user_service.dto.response.IntrospectReponse;
import com.example.user_service.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;


@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/token")
    ApiResponse<AuthenticationReponse> authenticate(@RequestBody AuthenticationRequest request){
        var result = authenticationService.authenticate(request);
        return ApiResponse. <AuthenticationReponse>builder()
                .result(result)
                .build();
    }
    @PostMapping("/introspect")
    ApiResponse<IntrospectReponse> introspect(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse. <IntrospectReponse>builder()
                .result(result)
                .build();
    }
}
