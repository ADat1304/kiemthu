package com.example.performance;

import static us.abstracta.jmeter.javadsl.JmeterDsl.*;
import us.abstracta.jmeter.javadsl.core.TestPlanStats;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;
import java.io.IOException;
import java.time.Duration;

public class CafePerformanceTest {

    private static final String BASE_URL = "http://localhost:8080";

    @Test
    public void testSystemPerformanceLoad() throws IOException {
        System.out.println("--- BẮT ĐẦU CHẠY THỬ NGHIỆM HIỆU NĂNG WEBSITE CAFÉ MANAGER ---");

        // Khởi tạo kế hoạch kiểm thử hiệu năng bằng JMeter Java Engine
        TestPlanStats stats = testPlan(
                // Khai báo Thread Group giả lập 50 users đồng thời thực hiện tải trong 2 phút
            threadGroup()
                    .rampTo(50, Duration.ofSeconds(10)) // Tăng tốc lên 50 users trong 10s
                    .holdingFor(Duration.ofMinutes(2))  // Giữ tải ổn định trong 2 phút
                    .children(

                                // 1. UC-01: Đăng nhập hệ thống (POST /auth/token)
                        httpSampler("UC-01: Đăng nhập API", BASE_URL + "/auth/token")
                            .post("{\"username\":\"admin\",\"password\":\"admin123\"}",
                                us.abstracta.jmeter.javadsl.core.samplers.DslHttpSampler.ContentType.APPLICATION_JSON)
                            .children(
                                    // Trích xuất JWT Token tự động trả về để dùng cho các request sau
                                jsonExtractor("jwt_token", "$.token")
                            ),

                        // 2. UC-03: Lọc & tải danh sách sản phẩm (GET /products)
                        httpSampler("UC-03: Tải Thực đơn API", BASE_URL + "/products")
                            .header("Authorization", "Bearer ${jwt_token}"),

                        // 3. UC-02: Admin thêm sản phẩm mới (POST /products)
                        httpSampler("UC-02: Thêm món API", BASE_URL + "/products")
                            .header("Authorization", "Bearer ${jwt_token}")
                            .post("{\"productName\":\"Trà Đào Cam Xả DSL\",\"price\":42000,\"amount\":100,\"categoryName\":\"Trà\"}",
                                us.abstracta.jmeter.javadsl.core.samplers.DslHttpSampler.ContentType.APPLICATION_JSON),

                        // 4. UC-04: Tạo tài khoản nhân viên mới (POST /users)
                        httpSampler("UC-04: Tạo Nhân viên API", BASE_URL + "/users")
                            .header("Authorization", "Bearer ${jwt_token}")
                            .post("{\"username\":\"nv_dsl_test\",\"password\":\"pass123\",\"fullname\":\"DSL User\",\"roles\":[\"USER\"]}",
                                us.abstracta.jmeter.javadsl.core.samplers.DslHttpSampler.ContentType.APPLICATION_JSON),

                        // 5. UC-05: Bán hàng POS - Tạo đơn hàng (POST /orders)
                        httpSampler("UC-05: Tạo Đơn hàng POS API", BASE_URL + "/orders")
                            .header("Authorization", "Bearer ${jwt_token}")
                            .post("{\"tableNumber\":\"5\",\"paymentMethodType\":\"Cash\",\"items\":[{\"productName\":\"Cà phê sữa đá\",\"quantity\":2,\"notes\":\"Ít sữa\"}]}",
                                 us.abstracta.jmeter.javadsl.core.samplers.DslHttpSampler.ContentType.APPLICATION_JSON)
                    ),

            // Ghi nhận báo cáo kết quả chi tiết dưới dạng trang HTML dashboard trực quan
            htmlReporter("target/jmeter-performance-reports")
    ).run();

        // In các chỉ số hiệu năng thực tế đo được
        long avgResponseTimeMs = stats.overall().sampleTime().mean().toMillis();
        double errorRate = stats.overall().errorsCount() * 100.0 / stats.overall().samplesCount();
        double throughput = stats.overall().throughput();

        System.out.println("=== KẾT QUẢ THỰC NGHIỆM ĐO ĐƯỢC CHÍNH XÁC NỀN TẢNG JVM ===");
        System.out.println("Thời gian phản hồi trung bình: " + avgResponseTimeMs + " ms");
        System.out.println("Tỷ lệ lỗi (Error Rate): " + errorRate + " %");
        System.out.println("Băng thông thực tế đạt: " + throughput + " TPS (Yêu cầu/giây)");

        // Khẳng định (Assertions) chuẩn JUnit đánh giá tiêu chuẩn hiệu năng
        assertTrue(avgResponseTimeMs < 500, "LỖI: Hệ thống chạy quá chậm! Avg Response time > 500ms");
        assertTrue(errorRate < 1.0, "LỖI: Tỷ lệ lỗi quá cao! Error rate > 1%");
        assertTrue(throughput > 100, "LỖI: Băng thông hệ thống quá thấp! Throughput < 100 TPS");
    }
}

