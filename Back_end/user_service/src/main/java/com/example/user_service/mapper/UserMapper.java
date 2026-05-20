package com.example.user_service.mapper;

import com.example.user_service.dto.request.UserCreationRequest;
import com.example.user_service.dto.request.UserUpdateRequest;

import com.example.user_service.dto.response.UserResponse;
import com.example.user_service.entity.Users;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    Users toUser(UserCreationRequest request);

    //    @Mapping(source =)
    UserResponse toUserReponse (Users user);


    void updateUser(@MappingTarget Users user, UserUpdateRequest request);
}

