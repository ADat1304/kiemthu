package com.gateway_service.service;


import com.gateway_service.client.AuthClient;
import com.gateway_service.client.OrderClient;
import com.gateway_service.client.ProductClient;
import com.gateway_service.dto.auth.IntrospectResponse;
import com.gateway_service.dto.esb.OrchestratedOrderResponse;
import com.gateway_service.dto.esb.ProductSummary;
import com.gateway_service.dto.order.OrderCreationRequest;
import com.gateway_service.dto.order.OrderResponse;
import com.gateway_service.dto.product.ProductResponse;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderOrchestrationService {

    private final AuthClient authClient;
    private final ProductClient productClient;
    private final OrderClient orderClient;

    public OrchestratedOrderResponse orchestrateOrder(String token, OrderCreationRequest request) {
        IntrospectResponse introspectResponse = authClient.introspect(token);
        if (introspectResponse == null || !introspectResponse.isValid()) {
            throw new AccessDeniedException("Token is invalid or expired");
        }

        List<ProductSummary> products = request.getItems()
                .stream()
                .map(item -> productClient.getProductByName(item.getProductName()))
                .filter(productResponse -> productResponse != null)
                .map(this::toSummary)
                .collect(Collectors.toList());

        OrderResponse order = orderClient.createOrder(request, token);

        return OrchestratedOrderResponse.builder()
                .requestedBy(extractUsername(token))
                .products(products)
                .order(order)
                .build();
    }

    private ProductSummary toSummary(ProductResponse response) {
        return ProductSummary.builder()
                .productId(response.getProductID())
                .productName(response.getProductName())
                .availableAmount(response.getAmount())
                .price(response.getPrice())
                .images(response.getImages())
                .build();
    }

    private String extractUsername(String token) {
        try {
            return SignedJWT.parse(token).getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            return "unknown";
        }
    }
}
