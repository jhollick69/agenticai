package com.example.sdlcfactory.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(
        @NotBlank @Size(min = 10, max = 8000) String description
) {}
