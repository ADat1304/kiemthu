# Hướng Dẫn Cài Đặt & Chạy Chương Trình Café Manager

Chào mừng bạn đến với ứng dụng quản lý quán café **Café Manager**. Dưới đây là hướng dẫn chi tiết từng bước để cài đặt cơ sở dữ liệu, xây dựng và khởi chạy cả hai phần: **Backend (Spring Boot Microservices)** và **Frontend (React UI)**.

---

## 🛠️ Yêu Cầu Hệ Thống (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
1. **Java Development Kit (JDK)**: Phiên bản **21** trở lên.
2. **Node.js**: Phiên bản **18.x** trở lên (khuyên dùng v20 hoặc v22).
3. **Apache Maven**: Để build và quản lý thư viện Backend.
4. **MySQL Database Server**: Phiên bản **8.0** trở lên.
5. **IDE khuyên dùng**: IntelliJ IDEA (dành cho Backend Java) và VS Code (dành cho Frontend React).

---

## 🗄️ Bước 1: Cấu Hình Cơ Sở Dữ Liệu MySQL

Hệ thống sử dụng cơ chế tự động tạo và cập nhật cấu trúc bảng (**Hibernate DDL Auto Update**), do đó bạn chỉ cần tạo một Database trống trên MySQL:

1. Mở MySQL Workbench hoặc Command Line và kết nối vào MySQL Server của bạn.
2. Chạy câu lệnh SQL sau để tạo cơ sở dữ liệu:
   ```sql
   CREATE DATABASE cafedb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Mặc định, cấu hình kết nối database của các dịch vụ Backend như sau:
   * **URL**: `jdbc:mysql://localhost:3306/cafedb`
   * **Username**: `root`
   * **Password**: `123456`

> [!NOTE]
> Nếu tài khoản MySQL của bạn sử dụng mật khẩu hoặc cổng kết nối khác, vui lòng mở các tệp `application.properties` trong thư mục con của từng dịch vụ sau để sửa đổi:
> * `Back_end/user_service/src/main/resources/application.properties`
> * `Back_end/Product_service/src/main/resources/application.properties`
> * `Back_end/order_service/src/main/resources/application.properties`

---

## ☕ Bước 2: Khởi Chạy Backend (Spring Boot Microservices)

Hệ thống Backend được thiết kế theo kiến trúc Microservices gồm 4 dịch vụ độc lập kết nối qua API Gateway:

| Dịch vụ | Chức năng chính | Port mặc định | Lớp Main Java để chạy |
| :--- | :--- | :--- | :--- |
| **user_service** | Quản lý nhân viên, ca làm và phân quyền | `8081` | `UserServiceApplication.java` |
| **product_service**| Quản lý thực đơn (món ăn, đồ uống, phân loại) | `8082` | `ProductServiceApplication.java` |
| **order_service** | Quản lý hóa đơn, đặt món tại bàn và doanh thu | `8083` | `OrderServiceApplication.java` |
| **gateway_service**| Cổng API trung gian định tuyến yêu cầu | `8080` | `GatewayServiceApplication.java` |

### Cách chạy bằng IDE (IntelliJ IDEA - Khuyên dùng)
1. Mở thư mục `Back_end` bằng IntelliJ IDEA dưới dạng dự án Maven.
2. Đợi IDE tải và đồng bộ các thư viện Maven (pom.xml).
3. Khởi chạy lần lượt các dịch vụ bằng cách nhấn chuột phải vào lớp Java chính (Main) tương ứng và chọn **Run**:
   * Chạy trước: `user_service`, `product_service`, `order_service`.
   * Chạy sau cùng: `gateway_service`.

### Cách chạy bằng Terminal (Dòng lệnh)
1. Di chuyển vào thư mục `Back_end`:
   ```bash
   cd Back_end
   ```
2. Build dự án bằng Maven:
   ```bash
   mvn clean install
   ```
3. Chạy từng dịch vụ bằng lệnh Maven (ở các cửa sổ Terminal riêng biệt):
   ```bash
   # Chạy User Service
   cd user_service && mvn spring-boot:run
   
   # Chạy Product Service
   cd ../product_service && mvn spring-boot:run
   
   # Chạy Order Service
   cd ../order_service && mvn spring-boot:run
   
   # Chạy Gateway Service
   cd ../gateway_service && mvn spring-boot:run
   ```

---

## 💻 Bước 3: Khởi Chạy Frontend (React UI)

Ứng dụng Frontend sử dụng React kết hợp với Vite để chạy môi trường phát triển và biên dịch production cực nhanh.

1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục `react_ui`:
   ```bash
   cd react_ui
   ```
2. Cài đặt các thư viện phụ thuộc (Dependencies):
   ```bash
   npm install
   ```
3. Khởi chạy Server phát triển (Development Server):
   ```bash
   npm run dev
   ```
4. Ứng dụng sẽ sẵn sàng hoạt động tại địa chỉ:
   👉 **[http://localhost:5173/](http://localhost:5173/)**

### Hỗ trợ build Production (Khi cần triển khai thực tế)
Nếu muốn kiểm tra biên dịch tối ưu hóa cho môi trường Production:
```bash
npm run build
npm run preview
```

---

## 🔑 Bước 4: Đăng Nhập Hệ Thống

Sau khi cả Backend và Frontend đều đã chạy thành công:
1. Truy cập vào **[http://localhost:5173/](http://localhost:5173/)** trên trình duyệt của bạn (có hỗ trợ chế độ giả lập thiết bị di động cực tốt).
2. Khi khởi chạy lần đầu tiên, hệ thống sẽ tự động khởi tạo **10 bàn mẫu** (bàn 1 đến bàn 10) và **Tài khoản Quản trị mặc định**:
   * **Tên đăng nhập (Username)**: `admin`
   * **Mật khẩu (Password)**: `admin`
3. Tiến hành đăng nhập để bắt đầu trải nghiệm quản lý quán café, tạo đơn hàng POS trực tiếp trên máy tính hoặc điện thoại di động!
