package com.example.user_service.common.exception;

public enum ErrorCode {
    PASSWORD_INVALID(1003,"Password must be at least 8 charactor"),
    INVALID_KEY(1002,"invalid key"),
    USER_EXISTED(1001, "user existed"),
    USER_NOT_EXISTED(1004, "user not existed"),
    UNAUTHENTICATED(1005, "Unauthenticated"),
    PRODUCT_EXISTED(1006,"product existed"),
    PRODUCT_NOT_FOUND(1007, "product not found"),
    PRODUCT_OUT_OF_STOCK(1008, "product does not have enough quantity"),
    TABLE_NOT_FOUND(1009, "table not found"),
    PAYMENT_METHOD_NOT_FOUND(1010, "payment method not found"),
    ORDER_ITEMS_EMPTY(1011, "order must contain at least one product");

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
