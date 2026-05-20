package com.example.product_service.common.exception;

public enum ErrorCode {
    PASSWORD_INVALID(1003,"Password must be at least 8 charactor"),
    INVALID_KEY(1002,"invalid key"),
    USER_EXISTED(1001, "user existed"),
    USER_NOT_EXISTED(1004, "user not existed"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    PRODUCT_EXISTED(1006,"product existed"),
    PRODUCT_NOT_FOUND(1007, "product not found"),
    PRODUCT_OUT_OF_STOCK(1008, "product does not have enough quantity"),
    PRODUCT_SERVICE_UNAVAILABLE(1009, "product service is not available"),
    TABLE_NOT_FOUND(1010, "table not found"),
    PAYMENT_METHOD_NOT_FOUND(1011, "payment method not found"),
    ORDER_ITEMS_EMPTY(1012, "order must contain at least one product"),
    SCRAPE_FAILED(1013, "Failed to scrape Highlands Coffee menu");

    private int code;
    private String messenger;

    ErrorCode(int code, String messenger) {
        this.code = code;
        this.messenger = messenger;
    }

    public int getCode() {
        return code;
    }

    public String getMessenger() {
        return messenger;
    }
}