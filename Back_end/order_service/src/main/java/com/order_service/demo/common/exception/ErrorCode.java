package com.order_service.demo.common.exception;

public enum ErrorCode {

    PRODUCT_NOT_FOUND(1007, "product not found"),
    PRODUCT_OUT_OF_STOCK(1008, "product does not have enough quantity"),
    PRODUCT_SERVICE_UNAVAILABLE(1009, "product service is not available"),
    TABLE_NOT_FOUND(1010, "table not found"),
    PAYMENT_METHOD_NOT_FOUND(1011, "payment method not found"),
    ORDER_ITEMS_EMPTY(1012, "order must contain at least one product"),
    ORDER_NOT_FOUND(1013, "order not found"),
    ORDER_STATUS_INVALID(1014, "order status is invalid"),
    ORDER_ALREADY_CLOSED(1015, "order has been closed"),
    ORDER_ITEM_NOT_FOUND(1016, "order item not found");

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