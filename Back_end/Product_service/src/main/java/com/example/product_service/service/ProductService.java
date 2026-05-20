package com.example.product_service.service;

import com.example.product_service.common.exception.AppException;
import com.example.product_service.common.exception.ErrorCode;
import com.example.product_service.dto.request.InventoryUpdateRequest;
import com.example.product_service.dto.request.ProductCreationRequest;
import com.example.product_service.dto.response.ProductResponse;
import com.example.product_service.entity.Category;
import com.example.product_service.entity.Image;
import com.example.product_service.entity.Product;
import com.example.product_service.mapper.ProductMapper;
import com.example.product_service.repository.CategoryRepository;
import com.example.product_service.repository.ProductRepository;
import com.example.product_service.scraper.HighlandsCoffeeScraper;
import com.example.product_service.scraper.HighlandsProduct;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;


import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductService {

    ProductRepository productRepository;
    ProductMapper productMapper;
    CategoryRepository categoryRepository;
    HighlandsCoffeeScraper highlandsCoffeeScraper;

    public ProductResponse createProduct(ProductCreationRequest request){
        if(productRepository.existsByProductName(request.getProductName()))
            throw new AppException(ErrorCode.PRODUCT_EXISTED);

        Product product = productMapper.toProduct(request);
        if (Objects.nonNull(request.getImages()) && !request.getImages().isEmpty()) {
            List<Image> images = request.getImages().stream()
                    .map(link -> Image.builder().imageLink(link).product(product).build())
                    .collect(Collectors.toList());
            product.setImages(images);
        }

        Category category = categoryRepository.findByCategoryName(request.getCategoryName())
                .orElseThrow(() -> new RuntimeException("Category not found: " + request.getCategoryName()));

        product.setCategory(category);
        Product savedProduct = productRepository.save(product);
        return productMapper.toProductResponse(savedProduct);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());
    }

    public ProductResponse getProductByName(String productName) {
        Product product = productRepository.findByProductName(productName)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return productMapper.toProductResponse(product);
    }

    public ProductResponse decrementInventory(String productId, InventoryUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (product.getAmount() < request.getQuantity()) {
            throw new AppException(ErrorCode.PRODUCT_OUT_OF_STOCK);
        }

        product.setAmount(product.getAmount() - request.getQuantity());
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public ProductResponse incrementInventory(String productId, InventoryUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        product.setAmount(product.getAmount() + request.getQuantity());
        return productMapper.toProductResponse(productRepository.save(product));
    }

    public List<ProductResponse> getProductsByCategory(String categoryName) {
        if (Objects.isNull(categoryName) || categoryName.isBlank() || categoryName.equalsIgnoreCase("all")) {
            return getAllProducts();
        }

        return productRepository.findByCategory_CategoryNameIgnoreCase(categoryName)
                .stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());
    }

    public List<String> getAllCategoryNames() {
        return categoryRepository.findAll().stream()
                .map(Category::getCategoryName)
                .distinct()
                .collect(Collectors.toList());
    }
    @Transactional
    public List<ProductResponse> resetAllInventoryTo(int quantity) {
        if (quantity < 0) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }

        List<Product> products = productRepository.findAll();
        products.forEach(product -> product.setAmount(quantity));
        return productRepository.saveAll(products)
                .stream()
                .map(productMapper::toProductResponse)
                .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void resetInventoryDaily() {
        resetAllInventoryTo(100);
    }
    // ================== IMPORT HIGHLANDS ==================

    public List<ProductResponse> importHighlandsCoffeeMenu() {
        List<HighlandsProduct> scrapedProducts;
        try {
            scrapedProducts = highlandsCoffeeScraper.scrapeMenu();
        } catch (Exception ex) {
            return List.of(); // hoặc throw AppExcep
        }

        Map<String, Category> categoryCache = new HashMap<>();
        List<ProductResponse> responses = new ArrayList<>();

        for (HighlandsProduct scrapedProduct : scrapedProducts) {
            if (shouldSkipHighlandsProduct(scrapedProduct)) {
                continue;
            }
            // chuẩn hoá category về Cà Phê / Trà / Freeze / Khác
            String categoryName = normalizeCategoryName(
                    scrapedProduct.categoryName(),  // raw category từ Highlands
                    scrapedProduct.productName()    // tên sản phẩm
            );

            Category category = categoryCache.computeIfAbsent(categoryName, name ->
                    categoryRepository.findByCategoryName(name)
                            .orElseGet(() -> categoryRepository.save(
                                    Category.builder().categoryName(name).build()
                            )));

            if (productRepository.existsByProductName(scrapedProduct.productName())) {
                continue;
            }

            Product product = Product.builder()
                    .productName(scrapedProduct.productName())
                    .price(scrapedProduct.price())
                    .amount(0)
                    .category(category)
                    .build();

            if (Objects.nonNull(scrapedProduct.imageUrl()) && !scrapedProduct.imageUrl().isBlank()) {
                product.setImages(List.of(
                        Image.builder()
                                .imageLink(scrapedProduct.imageUrl())
                                .product(product)
                                .build()
                ));
            }

            responses.add(productMapper.toProductResponse(productRepository.save(product)));
        }

        return responses;
    }


    // BỎ QUA một số sản phẩm Highlands không muốn import
    private boolean shouldSkipHighlandsProduct(HighlandsProduct p) {
        // Dùng normalizeText để bỏ dấu + viết hoa
        String name = normalizeText(p.productName());

        // Bỏ sản phẩm tên "CÀ PHÊ"
        if (name.equals("CA PHE")) {
            return true;
        }

        // nếu muốn bỏ luôn các sản phẩm giá 0 thì mở comment thêm:
        // if (p.price() == null || BigDecimal.ZERO.compareTo(p.price()) == 0) {
        //     return true;
        // }

        return false;
    }
    // =============== PHÂN LOẠI CATEGORY ===============
    private String normalizeCategoryName(String rawCategory, String productName) {
        // Chuẩn hoá tên sản phẩm (bỏ dấu, viết hoa)
        String normalizedProductName = normalizeText(productName);

        // 0) ƯU TIÊN: các sản phẩm BÁNH / ĐỒ ĂN -> Khác
        if (containsAny(normalizedProductName, List.of(
                "BANH ",       // "BÁNH " (Bánh Mì, Bánh Ngọt,...)
                " BANH",       // phòng trường hợp có khoảng trắng phía trước
                "BANH MI",     // Bánh Mì
                "BANH M",      // Bánh Mì (phòng lỗi dấu)
                "MI QUE",      // Bánh Mì Que
                "BREAD",
                "CAKE",
                "CAKES",
                "CHEESE CAKE",
                "CHEESECAKE",
                "SANDWICH",
                "BURGER",
                "PASTRY",
                "COOKIE",
                "CROISSANT",
                "MUFFIN"
        ))) {
            return "Khác";
        }

        // 1) Freeze
        if (containsAny(normalizedProductName, List.of(
                "FREEZE",
                "DA XAY",
                "COOKIES & CREAM",
                "Cookies & Cream"
        ))) {
            return "Freeze";
        }

        // 2) Trà
        if (containsAny(normalizedProductName, List.of(
                "TRA ",
                "TRA(",
                "TRA_",
                "TRA-",
                " TRA",
                "TEA",
                "OOLONG",
                "MATCHA",
                "SEN VANG",
                "CHANH",
                "TAC"
        ))) {
            return "Trà";
        }

        // 3) Cà Phê
        if (containsAny(normalizedProductName, List.of(
                "CA PHE",
                "COFFEE",
                "LATTE",
                "ESPRESSO",
                "AMERICANO",
                "CAPPUCCINO",
                "MACCHIATO",
                "MOCHA",
                "PHINDI",
                "COLD BREW",
                "BAC XIU",
                "PHIN"
        ))) {
            return "Cà Phê";
        }


        // 4) Fallback theo category gốc của Highlands nếu tên không đoán được
        String normalizedCategory = normalizeText(rawCategory);
        if (!normalizedCategory.isBlank()) {
            if (normalizedCategory.contains("FREEZE")) {
                return "Freeze";
            }
            if (normalizedCategory.contains("TRA")) {
                return "Trà";
            }
            if (normalizedCategory.contains("CA PHE") || normalizedCategory.contains("NGUYEN BAN")) {
                return "Cà Phê";
            }
        }

        // 5) Còn lại cho vào Khác
        return "Khác";
    }


    private boolean containsAny(String text, List<String> keywords) {
        for (String k : keywords) {
            if (text.contains(k)) {
                return true;
            }
        }
        return false;
    }

    private String normalizeText(String text) {
        if (Objects.isNull(text)) {
            return "";
        }
        String cleaned = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return cleaned.toUpperCase(Locale.ROOT);
    }

    // =============== UPDATE / DELETE ===============

    public ProductResponse updateProduct(String productId, ProductCreationRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        product.setProductName(request.getProductName());
        product.setPrice(request.getPrice());
        product.setAmount(request.getAmount());

        Category category = categoryRepository.findByCategoryName(request.getCategoryName())
                .orElseThrow(() -> new RuntimeException("Category not found: " + request.getCategoryName()));
        product.setCategory(category);

        if (Objects.nonNull(request.getImages())) {
            product.getImages().clear();
            List<Image> newImages = request.getImages().stream()
                    .map(link -> Image.builder().imageLink(link).product(product).build())
                    .collect(Collectors.toList());
            product.getImages().addAll(newImages);
        }

        return productMapper.toProductResponse(productRepository.save(product));
    }

    public void deleteProduct(String productId) {
        if (!productRepository.existsById(productId)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }
        productRepository.deleteById(productId);
    }
}
