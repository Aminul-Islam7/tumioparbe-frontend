# Tumio Parbe API Specification

## Overview

This document describes the API endpoints implemented in the Tumio Parbe backend system. The API uses REST architecture with JWT authentication.

**Base URL:** All API endpoints are prefixed with `/api/`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Account Management](#account-management)
3. [Course Management](#course-management)
4. [Enrollment Management](#enrollment-management)
5. [Payment Management](#payment-management)
6. [Reports & Statistics](#reports--statistics-admin-only)
7. [SMS Management](#sms-management-admin-only)
8. [Automation](#automation-admin-only)
9. [Data Types](#data-types)
10. [Error Handling](#error-handling)

---

## Authentication

The system uses JWT (JSON Web Token) authentication via `rest_framework_simplejwt`.

### Authentication Headers

Include the JWT token in request headers:

```
Authorization: Bearer <access_token>
```

### Token Endpoints

#### `POST /api/accounts/token/`

Get JWT tokens using phone/password credentials.

**Request:**

```json
{
  "phone": "01XXXXXXXXX",
  "password": "your_password"
}
```

**Response:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

#### `POST /api/accounts/token/refresh/`

Refresh an expired access token.

**Request:**

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:**

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

### Registration Flow

#### 1. `POST /api/accounts/request-otp/`

Request an OTP for phone verification.

**Request:**

```json
{
  "phone": "01XXXXXXXXX"
}
```

**Response (Success):**

```json
{
  "success": true,
  "phone": "01XXXXXXXXX",
  "expires_in": 300,
  "message": "OTP sent successfully to your phone."
}
```

**Response (Debug Mode - includes OTP):**

```json
{
  "success": true,
  "phone": "01XXXXXXXXX",
  "otp": "123456",
  "expires_in": 300,
  "message": "OTP generated successfully. In production, this would only be sent via SMS."
}
```

**Error Responses:**

- `400`: Invalid phone format or account already exists
- `429`: Rate limited (wait 60 seconds between requests)

---

#### 2. `POST /api/accounts/verify-otp/`

Verify the received OTP.

**Request:**

```json
{
  "phone": "01XXXXXXXXX",
  "otp": "123456"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "OTP verified successfully.",
  "valid_for": 600
}
```

**Error Responses:**

- `400`: Invalid or expired OTP
- `429`: Too many failed attempts (max 5)

---

#### 3. `POST /api/accounts/register/`

Complete registration with a verified phone number.

**Request:**

```json
{
  "phone": "01XXXXXXXXX",
  "name": "Parent Name",
  "address": "Full Address",
  "facebook_profile": "https://www.facebook.com/username",
  "email": "optional@email.com",
  "password": "your_password",
  "confirm_password": "your_password"
}
```

**Response (Success):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "phone": "01XXXXXXXXX",
    "name": "Parent Name",
    "address": "Full Address",
    "facebook_profile": "https://www.facebook.com/username",
    "email": "optional@email.com",
    "is_admin": false
  },
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "message": "Registration successful!"
}
```

**Error Responses:**

- `400`: Phone not verified or validation errors

---

## Account Management

### Profile Management

#### `GET /api/accounts/profile/`

Get the authenticated user's profile.

**Response:**

```json
{
  "id": 1,
  "phone": "01XXXXXXXXX",
  "name": "Parent Name",
  "address": "Full Address",
  "facebook_profile": "https://www.facebook.com/username",
  "email": "optional@email.com",
  "is_admin": false
}
```

---

#### `PUT /api/accounts/profile/`

Update profile information (partial updates supported).

**Request:**

```json
{
  "name": "Updated Name",
  "address": "New Address"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "01XXXXXXXXX",
    "name": "Updated Name",
    "address": "New Address",
    "facebook_profile": "https://www.facebook.com/username",
    "email": "optional@email.com",
    "is_admin": false
  }
}
```

---

### Password Management

#### `POST /api/accounts/change-password/`

Change password for authenticated users. Requires current password verification.

**Authentication:** Required

**Request:**

```json
{
  "current_password": "old_password",
  "new_password": "new_password",
  "confirm_password": "new_password"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

**Error Responses:**

- `400`: Current password incorrect, passwords don't match, or password too short (min 6 chars)

---

### Password Recovery (Forgot Password)

#### 1. `POST /api/accounts/request-password-reset-otp/`

Request an OTP for password reset. Similar to registration OTP but checks that an account exists.

**Authentication:** Not required

**Request:**

```json
{
  "phone": "01XXXXXXXXX"
}
```

**Response (Success):**

```json
{
  "success": true,
  "phone": "01XXXXXXXXX",
  "expires_in": 300,
  "message": "OTP sent successfully to your phone."
}
```

**Response (Debug Mode - includes OTP):**

```json
{
  "success": true,
  "phone": "01XXXXXXXXX",
  "otp": "123456",
  "expires_in": 300,
  "message": "OTP generated successfully. In production, this would only be sent via SMS."
}
```

**Error Responses:**

- `400`: Invalid phone format
- `404`: No account found with this phone number
- `429`: Rate limited (wait 60 seconds between requests)

---

#### 2. `POST /api/accounts/reset-password/`

Reset password after OTP verification.

**Authentication:** Not required

**Request:**

```json
{
  "phone": "01XXXXXXXXX",
  "otp": "123456",
  "new_password": "new_password",
  "confirm_password": "new_password"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

**Error Responses:**

- `400`: Invalid or expired OTP, passwords don't match, password too short
- `404`: User not found
- `429`: Too many failed OTP attempts (max 5)

---

### Student Management

#### `GET /api/accounts/students/`

List all students under the authenticated parent's account.

**Response:**

```json
[
  {
    "id": 1,
    "parent": 1,
    "name": "Student Name",
    "date_of_birth": "2010-05-15",
    "school": "ABC School",
    "current_class": "Class 8",
    "father_name": "Father's Name",
    "mother_name": "Mother's Name"
  }
]
```

---

#### `POST /api/accounts/students/`

Add a new student.

**Request:**

```json
{
  "name": "Student Name",
  "date_of_birth": "2010-05-15",
  "school": "ABC School",
  "current_class": "Class 8",
  "father_name": "Father's Name",
  "mother_name": "Mother's Name"
}
```

**Response:** Returns the created student object.

---

#### `GET /api/accounts/students/{id}/`

Get specific student details.

---

#### `PUT /api/accounts/students/{id}/`

Update student information.

---

#### `DELETE /api/accounts/students/{id}/`

Delete a student.

---

## Course Management

### Courses

#### `GET /api/courses/courses/`

List all courses. Regular users see only active courses; staff see all.

**Response:**

```json
[
  {
    "id": 1,
    "name": "HSC Physics 2025",
    "description": "Complete HSC Physics course",
    "image": "/media/courses/physics.jpg",
    "admission_fee": "1000.00",
    "monthly_fee": "2500.00",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "batches": [...],
    "batch_count": 3,
    "student_count": 45
  }
]
```

---

#### `GET /api/courses/courses/{id}/`

Get specific course details with all batches.

---

#### `POST /api/courses/courses/` (Staff Only)

Create a new course.

**Request:**

```json
{
  "name": "HSC Physics 2025",
  "description": "Complete HSC Physics course",
  "admission_fee": "1000.00",
  "monthly_fee": "2500.00",
  "is_active": true
}
```

---

#### `PUT /api/courses/courses/{id}/` (Staff Only)

Update course information.

---

#### `DELETE /api/courses/courses/{id}/` (Staff Only)

Delete or deactivate a course. If there are batches or enrollments, the course is marked as inactive instead of deleted.

---

#### `GET /api/courses/courses/check_permissions/`

Debug endpoint to check user permissions.

**Response:**

```json
{
  "username": "01XXXXXXXXX",
  "is_staff": true,
  "is_admin": true,
  "is_superuser": true,
  "can_create_course": true,
  "permissions": []
}
```

---

### Batches

#### `GET /api/courses/batches/`

List batches. Regular users see visible batches of active courses plus enrolled batches.

**Response:**

```json
[
  {
    "id": 1,
    "name": "Batch A - Evening",
    "timing": "6:00 PM - 8:00 PM",
    "group_link": "https://facebook.com/groups/example",
    "class_link": "https://zoom.us/j/example",
    "tuition_fee": "2500.00",
    "is_visible": true,
    "course": 1,
    "course_name": "HSC Physics 2025",
    "student_count": 25,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

---

#### `GET /api/courses/batches/{id}/`

Get specific batch details.

---

#### `POST /api/courses/batches/` (Staff Only)

Create a new batch.

**Request:**

```json
{
  "course": 1,
  "name": "Batch A - Evening",
  "timing": "6:00 PM - 8:00 PM",
  "group_link": "https://facebook.com/groups/example",
  "class_link": "https://zoom.us/j/example",
  "tuition_fee": "2500.00",
  "is_visible": true
}
```

---

#### `DELETE /api/courses/batches/{id}/` (Staff Only)

Delete or hide a batch. If there are active enrollments, the batch is marked as invisible instead.

---

#### `GET /api/courses/batches/{id}/enrolled_students/`

Get students enrolled in this batch. Staff can see all; parents can see if their student is enrolled.

**Response (Staff):**

```json
[
  {
    "id": 1,
    "parent": 1,
    "name": "Student Name",
    "date_of_birth": "2010-05-15",
    "school": "ABC School",
    "current_class": "Class 8",
    "father_name": "Father's Name",
    "mother_name": "Mother's Name"
  }
]
```

**Response (Parent):**

```json
[
  { "id": 1, "name": "Student Name" }
]
```

---

#### `POST /api/courses/batches/{id}/transfer_students/` (Staff Only)

Transfer students from one batch to another within the same course.

**Request:**

```json
{
  "destination_batch_id": 2,
  "student_ids": [1, 2, 3]
}
```

**Response:**

```json
{
  "source_batch": { "id": 1, "name": "Batch A" },
  "destination_batch": { "id": 2, "name": "Batch B" },
  "transferred_students": [
    { "id": 1, "name": "Student 1" },
    { "id": 2, "name": "Student 2" }
  ],
  "count": 2
}
```

---

## Enrollment Management

### Enrollment Endpoints

#### `GET /api/enrollments/enrollments/`

List enrollments. Regular users see their students' enrollments; staff see all.

**Response:**

```json
[
  {
    "id": 1,
    "student": 1,
    "batch": 1,
    "start_month": "2024-01-01",
    "tuition_fee": "2500.00",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "student_details": {...},
    "batch_details": {...}
  }
]
```

---

#### `GET /api/enrollments/enrollments/{id}/`

Get specific enrollment details.

---

#### `POST /api/enrollments/enrollments/initiate/`

Initiate an enrollment - calculate fees, check eligibility, apply coupon.

**Request:**

```json
{
  "student": 1,
  "batch": 1,
  "start_month": "2024-02-01",
  "coupon_code": "WELCOME2024"
}
```

**Response:**

```json
{
  "student_id": 1,
  "student_name": "Student Name",
  "batch_id": 1,
  "batch_name": "Batch A - Evening",
  "course_name": "HSC Physics 2025",
  "start_month": "2024-02-01",
  "admission_fee": "1000.00",
  "tuition_fee": "2500.00",
  "total_amount": "3500.00",
  "coupon_applied": true,
  "payment_required": true,
  "first_month_waiver": false,
  "enrollment_data": {
    "student": 1,
    "batch": 1,
    "start_month": "2024-02-01",
    "tuition_fee": "2500.00",
    "coupon_code": "WELCOME2024",
    "first_month_waiver": false
  }
}
```

---

#### `POST /api/enrollments/enrollments/initiate_payment/`

Start bKash payment for enrollment.

**Request:**

```json
{
  "enrollment_data": {
    "student": 1,
    "batch": 1,
    "start_month": "2024-02-01",
    "tuition_fee": "2500.00",
    "coupon_code": "WELCOME2024"
  },
  "callback_url": "https://yoursite.com/payment/callback",
  "customer_phone": "01XXXXXXXXX"
}
```

**Response:**

```json
{
  "temp_invoice_id": 123,
  "payment_id": "TR0011OVYqHh1719123456789",
  "bkash_url": "https://sandbox.bka.sh/checkout?paymentId=...",
  "total_amount": "3500.00",
  "first_month_waiver": false,
  "callback_urls": {
    "success": "https://yoursite.com/payment/callback?status=success",
    "failure": "https://yoursite.com/payment/callback?status=failure",
    "cancelled": "https://yoursite.com/payment/callback?status=cancel"
  },
  "enrollment_data": {...}
}
```

---

#### `POST /api/enrollments/enrollments/complete_with_payment/`

Complete enrollment after successful bKash payment.

**Request:**

```json
{
  "enrollment_data": {
    "student": 1,
    "batch": 1,
    "start_month": "2024-02-01",
    "tuition_fee": "2500.00",
    "coupon_code": "WELCOME2024",
    "first_month_waiver": false
  },
  "bkash_payment_id": "TR0011OVYqHh1719123456789",
  "temp_invoice_id": 123
}
```

**Response:**

```json
{
  "enrollment": {...},
  "first_month_invoice_id": 1,
  "next_month_invoice_id": 2,
  "first_month_waiver": false,
  "payment_status": "Completed",
  "transaction_id": "TRX123456789",
  "payment_method": "bKash"
}
```

---

#### `POST /api/enrollments/enrollments/verify_and_complete_payment/`

Recovery mechanism: Verify payment with bKash and complete enrollment if successful.

**Request:**

```json
{
  "bkash_payment_id": "TR0011OVYqHh1719123456789",
  "enrollment_data": {...},
  "temp_invoice_id": 123
}
```

---

#### `POST /api/enrollments/enrollments/{id}/transfer_batch/`

Transfer a student from one batch to another within the same course.

**Request:**

```json
{
  "batch_id": 2
}
```

**Response:**

```json
{
  "message": "Successfully transferred Student Name from Batch A to Batch B",
  "enrollment_id": 1,
  "student_name": "Student Name",
  "previous_batch": "Batch A",
  "new_batch": "Batch B",
  "course_name": "HSC Physics 2025"
}
```

---

#### `POST /api/enrollments/enrollments/{id}/unenroll/`

Unenroll a student by deactivating their enrollment.

**Response:**

```json
{
  "message": "Successfully unenrolled Student Name from HSC Physics 2025 - Batch A",
  "enrollment_id": 1,
  "student_name": "Student Name",
  "batch_name": "Batch A",
  "course_name": "HSC Physics 2025"
}
```

---

#### `POST /api/enrollments/enrollments/{id}/apply_coupon/`

Apply a coupon to an existing enrollment for future tuition fee reduction.

**Request:**

```json
{
  "coupon_code": "DISCOUNT10"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Applied 10% discount to 3 future invoices",
  "updated_invoices": [
    {
      "month": "March 2024",
      "original_amount": "2500.00",
      "discount_amount": "250.00",
      "new_amount": "2250.00"
    }
  ],
  "enrollment": {...}
}
```

---

### Coupon Endpoints

#### `GET /api/enrollments/coupons/`

List all coupons.

---

#### `GET /api/enrollments/coupons/{id}/`

Get specific coupon details.

---

#### `POST /api/enrollments/coupons/` (Staff Only)

Create a new coupon.

**Request:**

```json
{
  "code": "WELCOME2024",
  "name": "Welcome Offer 2024",
  "discount_types": ["ADMISSION", "FIRST_MONTH"],
  "discount_value": null,
  "expires_at": "2024-12-31T23:59:59Z"
}
```

---

#### `GET /api/enrollments/coupons/validate/`

Validate a coupon code and get discount information.

**Query Parameters:**

- `code` (required): Coupon code
- `admission_fee` (optional): For calculating exact discount
- `tuition_fee` (optional): For calculating exact discount

**Response:**

```json
{
  "id": 1,
  "code": "WELCOME2024",
  "name": "Welcome Offer 2024",
  "discount_types": ["ADMISSION", "FIRST_MONTH"],
  "discount_types_display": ["Admission Fee Waiver", "First Month Waiver"],
  "discount_value": null,
  "expires_at": "2024-12-31T23:59:59Z",
  "is_expired": false,
  "benefits": [
    {
      "type": "ADMISSION",
      "description": "Admission fee waived",
      "original_amount": "1000.00",
      "new_amount": "0.00"
    },
    {
      "type": "FIRST_MONTH",
      "description": "First month tuition fee waived",
      "original_amount": "2500.00",
      "new_amount": "0.00"
    }
  ]
}
```

---

## Payment Management

### Invoice Payment

#### `GET /api/payments/payments/pending_invoices/`

List pending (unpaid) invoices. Regular users see only their students' invoices.

**Response:**

```json
[
  {
    "id": 1,
    "enrollment": 1,
    "month": "2024-02-01",
    "amount": "2500.00",
    "is_paid": false,
    "coupon": null,
    "created_at": "2024-01-15T10:30:00Z",
    "student_name": "Student Name",
    "course_name": "HSC Physics 2025",
    "batch_name": "Batch A - Evening",
    "month_display": "February 2024"
  }
]
```

---

#### `POST /api/payments/payments/pay_invoice/`

Pay a single invoice using bKash.

**Request:**

```json
{
  "invoice_id": 1,
  "callback_url": "https://yoursite.com/payment/callback",
  "customer_phone": "01XXXXXXXXX"
}
```

**Response:**

```json
{
  "payment_id": 1,
  "bkash_payment_id": "TR0011OVYqHh1719123456789",
  "bkash_url": "https://sandbox.bka.sh/checkout?paymentId=...",
  "callback_urls": {
    "success": "...",
    "failure": "...",
    "cancelled": "..."
  }
}
```

---

#### `POST /api/payments/payments/bulk_pay_invoices/`

Pay multiple invoices at once using bKash.

**Request:**

```json
{
  "invoice_ids": [1, 2, 3],
  "callback_url": "https://yoursite.com/payment/callback",
  "customer_phone": "01XXXXXXXXX"
}
```

**Response:**

```json
{
  "payment_id": 1,
  "bkash_payment_id": "TR0011OVYqHh1719123456789",
  "bkash_url": "https://sandbox.bka.sh/checkout?paymentId=...",
  "total_amount": "7500.00",
  "invoice_count": 3,
  "callback_urls": {...}
}
```

---

#### `POST /api/payments/payments/initiate_bkash/`

Initiate bKash payment for an invoice (alternative to `pay_invoice`).

**Request:**

```json
{
  "invoice_id": 1,
  "callback_url": "https://yoursite.com/payment/callback",
  "customer_phone": "01XXXXXXXXX"
}
```

---

### Payment Processing

#### `POST /api/payments/payments/execute_bkash_payment/`

Execute bKash payment after user authorization.

**Request:**

```json
{
  "paymentID": "TR0011OVYqHh1719123456789"
}
```

**Response (Success):**

```json
{
  "status": "success",
  "transaction_id": "TRX123456789",
  "payment_status": "Completed",
  "message": "Payment completed successfully."
}
```

**Response (With Enrollment):**

```json
{
  "status": "success",
  "transaction_id": "TRX123456789",
  "payment_status": "Completed",
  "message": "Payment completed and enrollment created successfully.",
  "enrollment": {...}
}
```

---

#### `POST /api/payments/payments/query_bkash_payment/`

Query the status of a bKash payment.

**Request:**

```json
{
  "paymentID": "TR0011OVYqHh1719123456789"
}
```

**Response:**

```json
{
  "payment_id": 1,
  "bkash_payment_id": "TR0011OVYqHh1719123456789",
  "transaction_status": "Completed",
  "payment_status": "Completed"
}
```

---

#### `GET /api/payments/payments/payment_history/`

Get payment history. Regular users see payments for their students.

**Response:**

```json
[
  {
    "id": 1,
    "invoice": 1,
    "transaction_id": "TRX123456789",
    "amount": "2500.00",
    "payment_method": "bKash",
    "status": "Completed",
    "payment_id": "TR0011OVYqHh1719123456789",
    "payer_reference": "01XXXXXXXXX",
    "created_at": "2024-01-15T10:30:00Z",
    "student_name": "Student Name",
    "course_name": "HSC Physics 2025",
    "batch_name": "Batch A - Evening",
    "month": "February 2024"
  }
]
```

---

#### `POST /api/payments/payments/create_manual_invoice/` (Admin Only)

Create a manual invoice.

**Request:**

```json
{
  "enrollment": 1,
  "month": "2024-03-01",
  "amount": "2500.00",
  "is_paid": false,
  "coupon": null,
  "description": "Additional fee"
}
```

**Response:**

```json
{
  "invoice": {...},
  "payment": null,
  "message": "Manual invoice created successfully"
}
```

---

### bKash Callback Endpoints

#### `GET /api/payments/bkash/callback/`

Handle bKash payment callbacks (success, failure, cancelled). Redirects to appropriate frontend URLs.

**Query Parameters:**

- `paymentID`: bKash payment ID
- `status`: `success`, `failure`, or `cancel`

---

#### `POST /api/payments/bkash/webhook/`

Handle bKash webhook notifications (no authentication required).

---

## Reports & Statistics (Admin Only)

### Financial Reports

#### `GET /api/common/reports/financial_summary/`

Get financial statistics including total dues, earnings, and trends.

**Response:**

```json
{
  "total_dues": 150000.0,
  "current_month_dues": 25000.0,
  "total_earnings": 500000.0,
  "current_month_earnings": 45000.0,
  "monthly_trends": [
    {
      "month": "Aug 2024",
      "earnings": 42000.0,
      "collection_rate": 85.5
    }
  ],
  "as_of_date": "2024-12-28"
}
```

---

### Enrollment Reports

#### `GET /api/common/reports/enrollment_statistics/`

Get enrollment statistics and metrics.

**Response:**

```json
{
  "total_students": 250,
  "active_enrollments": 180,
  "total_courses": 5,
  "total_batches": 15,
  "course_enrollment_data": [
    {
      "course_id": 1,
      "course_name": "HSC Physics 2025",
      "enrollment_count": 45,
      "batches": [
        {
          "batch_id": 1,
          "batch_name": "Batch A",
          "enrollment_count": 25
        }
      ]
    }
  ],
  "enrollment_trends": [
    {
      "month": "Dec 2024",
      "new_enrollments": 12
    }
  ],
  "as_of_date": "2024-12-28"
}
```

---

### SMS Reports

#### `GET /api/common/reports/sms_statistics/`

Get SMS delivery statistics.

**Response:**

```json
{
  "by_type": {
    "OTP": {
      "type_name": "OTP",
      "total_sent": 500,
      "successful": 495,
      "failed": 5,
      "success_rate": 99.0
    },
    "PAYMENT_REMINDER": {...},
    "CUSTOM": {...},
    "BULK": {...}
  },
  "overall": {
    "total_sent": 1200,
    "successful": 1180,
    "failed": 20,
    "success_rate": 98.3
  },
  "monthly_breakdown": [...],
  "as_of_date": "2024-12-28"
}
```

---

## SMS Management (Admin Only)

#### `GET /api/common/sms/`

List SMS logs with filtering and search.

**Query Parameters:**

- `message_type`: Filter by type (OTP, PAYMENT_REMINDER, CUSTOM, BULK)
- `status`: Filter by status (SUCCESS, FAILED, PARTIAL, PENDING, DISABLED)
- `start_date`: Filter from date
- `end_date`: Filter to date
- `search`: Search phone number or message

---

#### `GET /api/common/sms/{id}/`

Get specific SMS log details.

---

#### `POST /api/common/sms/send_single/`

Send a single SMS.

**Request:**

```json
{
  "phone_number": "01XXXXXXXXX",
  "message": "Your message content"
}
```

**Response:**

```json
{
  "success": true,
  "message": "SMS sent successfully to 01XXXXXXXXX",
  "log_id": 123
}
```

---

#### `POST /api/common/sms/send_bulk/`

Send the same SMS to multiple recipients.

**Request:**

```json
{
  "phone_numbers": ["01XXXXXXXXX", "01YYYYYYYYY"],
  "message": "Your message content"
}
```

---

#### `GET /api/common/sms/check_balance/`

Check current SMS balance from the provider.

**Response:**

```json
{
  "success": true,
  "balance": "1500"
}
```

---

#### `GET /api/common/sms/get_stats/`

Get SMS usage statistics from the provider.

---

#### `GET /api/common/sms/dashboard_stats/`

Get SMS dashboard statistics from the database.

**Response:**

```json
{
  "success": true,
  "total_sms_sent": 1200,
  "success_rate": 98.3,
  "by_type": {
    "otp": 500,
    "payment_reminder": 300,
    "custom": 200,
    "bulk": 200
  },
  "by_status": {
    "success": 1180,
    "failed": 20,
    "partial": 0,
    "pending": 0,
    "disabled": 0
  }
}
```

---

## Automation (Admin Only)

#### `POST /api/common/automation/generate_invoices/`

Manually trigger invoice generation for next month.

**Response:**

```json
{
  "success": true,
  "message": "Invoice generation task started",
  "task_id": "abc123..."
}
```

---

#### `POST /api/common/automation/send_reminders/`

Manually trigger payment reminder sending.

**Response:**

```json
{
  "success": true,
  "message": "Payment reminder task started",
  "task_id": "abc123..."
}
```

---

#### `GET /api/common/automation/get_settings/`

Get current automation settings.

**Response:**

```json
{
  "success": true,
  "payment_reminder_days": [1, 5, 10],
  "invoice_generation_days": 3,
  "auto_generate_invoices": true,
  "auto_send_reminders": true
}
```

---

## Data Types

### User Object

```json
{
  "id": "integer",
  "phone": "string (01XXXXXXXXX)",
  "name": "string",
  "address": "string",
  "facebook_profile": "string (URL)",
  "email": "string (optional)",
  "is_admin": "boolean"
}
```

### Student Object

```json
{
  "id": "integer",
  "parent": "integer (user_id)",
  "name": "string",
  "date_of_birth": "date (YYYY-MM-DD)",
  "school": "string (optional)",
  "current_class": "string (optional)",
  "father_name": "string",
  "mother_name": "string"
}
```

### Course Object

```json
{
  "id": "integer",
  "name": "string",
  "description": "string (optional)",
  "image": "string (URL, optional)",
  "admission_fee": "decimal",
  "monthly_fee": "decimal",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime",
  "batches": "array of batch objects",
  "batch_count": "integer",
  "student_count": "integer"
}
```

### Batch Object

```json
{
  "id": "integer",
  "course": "integer (course_id)",
  "course_name": "string",
  "name": "string",
  "timing": "string",
  "group_link": "string (URL, optional)",
  "class_link": "string (URL, optional)",
  "tuition_fee": "decimal (optional, overrides course monthly_fee)",
  "is_visible": "boolean",
  "student_count": "integer",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Enrollment Object

```json
{
  "id": "integer",
  "student": "integer (student_id)",
  "batch": "integer (batch_id)",
  "start_month": "date (YYYY-MM-DD)",
  "tuition_fee": "decimal (optional)",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime",
  "student_details": "student object",
  "batch_details": "batch object"
}
```

### Invoice Object

```json
{
  "id": "integer",
  "enrollment": "integer (enrollment_id, nullable for temp invoices)",
  "month": "date (YYYY-MM-DD)",
  "amount": "decimal",
  "is_paid": "boolean",
  "coupon": "integer (optional, coupon_id)",
  "created_at": "datetime"
}
```

### Payment Object

```json
{
  "id": "integer",
  "invoice": "integer (invoice_id)",
  "transaction_id": "string (unique)",
  "amount": "decimal",
  "payment_method": "string (default: 'bKash')",
  "status": "string (Initiated, Completed, Failed, Cancelled)",
  "payment_id": "string (bKash payment ID)",
  "payer_reference": "string (phone number)",
  "created_at": "datetime",
  "payment_create_time": "datetime",
  "payment_execute_time": "datetime"
}
```

### Coupon Object

```json
{
  "id": "integer",
  "code": "string (unique)",
  "name": "string",
  "discount_types": "array (ADMISSION, FIRST_MONTH, TUITION)",
  "discount_types_display": "array of readable descriptions",
  "discount_value": "decimal (percentage for TUITION discount, optional)",
  "expires_at": "datetime",
  "is_expired": "boolean",
  "is_active": "boolean"
}
```

### SMS Log Object

```json
{
  "id": "integer",
  "phone_number": "string",
  "message": "string",
  "message_type": "string (OTP, PAYMENT_REMINDER, CUSTOM, BULK)",
  "status": "string (SUCCESS, FAILED, PARTIAL, PENDING, DISABLED)",
  "recipient_count": "integer",
  "successful_count": "integer",
  "failed_count": "integer",
  "sent_by": "integer (user_id, optional)",
  "created_at": "datetime"
}
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

| Code | Description            |
| ---- | ---------------------- |
| 200  | Success                |
| 201  | Created                |
| 207  | Multi-Status (partial) |
| 400  | Bad Request            |
| 401  | Unauthorized           |
| 403  | Forbidden              |
| 404  | Not Found              |
| 429  | Too Many Requests      |
| 500  | Server Error           |

### Error Response Format

```json
{
  "error": "Error message",
  "details": {}
}
```

### Validation Error Format

```json
{
  "success": false,
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

---

## Notes

1. **Bangladesh Phone Format**: All phone numbers must match the pattern `^01[2-9]\d{8}$` (e.g., `01841234567`).

2. **Date Formats**: Use ISO 8601 format (`YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:MM:SSZ` for datetimes).

3. **Decimal Values**: All monetary values are returned as strings with 2 decimal places.

4. **Authentication**: Most endpoints require JWT authentication. Exceptions include registration flow endpoints and bKash callbacks.

5. **Admin Endpoints**: Endpoints marked "(Staff Only)" or "(Admin Only)" require `is_staff=True` on the user account.

6. **Course Fee Structure**:
   - `admission_fee`: One-time fee charged during enrollment
   - `monthly_fee`: Default tuition fee for the course
   - `tuition_fee` on Batch: Optional override of course's monthly_fee

7. **Coupon Discount Types**:
   - `ADMISSION`: Waives the admission fee
   - `FIRST_MONTH`: Waives the first month's tuition fee
   - `TUITION`: Applies a percentage discount (requires `discount_value`)
