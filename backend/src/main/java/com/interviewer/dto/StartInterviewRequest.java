package com.interviewer.dto;

import jakarta.validation.constraints.NotBlank;

public class StartInterviewRequest {

    @NotBlank(message = "Role category is required")
    private String roleCategory;

    public StartInterviewRequest() {}

    public String getRoleCategory() { return roleCategory; }
    public void setRoleCategory(String roleCategory) { this.roleCategory = roleCategory; }
}
