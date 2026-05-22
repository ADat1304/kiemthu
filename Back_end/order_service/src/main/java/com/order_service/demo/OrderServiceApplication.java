package com.order_service.demo;

import com.order_service.demo.entity.CafeTable;
import com.order_service.demo.entity.PaymentMethod;
import com.order_service.demo.repository.CafeTableRepository;
import com.order_service.demo.repository.PaymentMethodRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class OrderServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(OrderServiceApplication.class, args);
	}

	@Bean
	CommandLineRunner initData(CafeTableRepository tableRepository, PaymentMethodRepository paymentMethodRepository) {
		return args -> {
			// Khởi tạo bàn mẫu
			List<String> defaultTables = List.of("1", "2", "3", "4", "5", "6", "7", "8", "9", "10");
			for (String tableNum : defaultTables) {
				if (tableRepository.findByTableNumber(tableNum).isEmpty()) {
					CafeTable table = CafeTable.builder()
							.tableNumber(tableNum)
							.status(0)
							.build();
					tableRepository.save(table);
					System.out.println("Tự động khởi tạo bàn số: " + tableNum);
				}
			}

			// Khởi tạo phương thức thanh toán mẫu
			List<String> defaultPaymentMethods = List.of("Cash", "Credit Card", "E-Wallet");
			for (String methodType : defaultPaymentMethods) {
				if (paymentMethodRepository.findByPaymentMethodType(methodType).isEmpty()) {
					PaymentMethod method = PaymentMethod.builder()
							.paymentMethodType(methodType)
							.build();
					paymentMethodRepository.save(method);
					System.out.println("Tự động khởi tạo phương thức thanh toán: " + methodType);
				}
			}
		};
	}
}
