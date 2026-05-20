package com.gateway_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@ConfigurationProperties(prefix = "esb.services")
public class ServiceEndpointsProperties {
    private String user;
    private String product;
    private String order;
}