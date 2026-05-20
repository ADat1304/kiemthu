package com.example.product_service.scraper;

import java.math.BigDecimal;

public record HighlandsProduct(String categoryName,
                               String productName,
                               BigDecimal price,
                               String imageUrl) {
}
