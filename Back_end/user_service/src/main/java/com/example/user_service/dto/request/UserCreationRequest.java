package com.example.user_service.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
     String username;

    @Size(min = 8, message = "PASSWORD_INVALID")
     String password;
     String fullname;
     List<String> roles;
}
