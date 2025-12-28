# Tumio Parbe API Specification

## Overview

This document describes the API endpoints implemented in the Tumio Parbe backend system. The API uses REST architecture with JWT authentication.

## Base URL

All API endpoints are prefixed with `/api/`

## Authentication

The system uses JWT (JSON Web Token) authentication.

### Authentication Endpoints

- `POST /api/accounts/token/`

  - Get JWT tokens using phone/password
  - Request: `{ "phone": "01XXXXXXXXX", "password": "xxx" }`
  - Response: `{ "refresh": "xxx", "access": "xxx" }`

- `POST /api/accounts/token/refresh/`
  - Refresh expired access token
  - Request: `{ "refresh": "xxx" }`
  - Response: `{ "access": "xxx" }`

### Registration Flow

1. `POST /api/accounts/request-otp/`

   - Request OTP for phone verification
   - Request: `{ "phone": "01XXXXXXXXX" }`
   - Response: `{ "success": true, "expires_in": 300 }`

2. `POST /api/accounts/verify-otp/`

   - Verify received OTP
   - Request: `{ "phone": "01XXXXXXXXX", "otp": "XXXX" }`
   - Response: `{ "success": true }`

3. `POST /api/accounts/register/`
   - Complete registration with verified phone
   - Request:
     ```json
     {
     	"phone": "01XXXXXXXXX",
     	"name": "Parent Name",
     	"address": "Full Address",
     	"facebook_profile": "https://www.facebook.com/username",
     	"email": "optional@email.com",
     	"password": "xxx",
     	"confirm_password": "xxx"
     }
     ```
   - Response:
     ```json
     {
       "success": true,
       "user": {user_object},
       "refresh": "xxx",
       "access": "xxx"
     }
     ```

## Account Management

### Profile Management

- `GET /api/accounts/profile/`

  - Get authenticated user's profile
  - Response: Parent account details

- `PUT /api/accounts/profile/`
  - Update profile information
  - Request: Updated profile fields
  - Response: Updated profile object

### Student Management

- `GET /api/accounts/students/`

  - List all students under parent account
  - Response: Array of student objects

- `POST /api/accounts/students/`

  - Add new student
  - Request:
    ```json
    {
    	"name": "Student Name",
    	"date_of_birth": "YYYY-MM-DD",
    	"school": "School Name",
    	"current_class": "Class 10",
    	"father_name": "Father's Name",
    	"mother_name": "Mother's Name"
    }
    ```

- `GET /api/accounts/students/{id}/`

  - Get specific student details
  - Response: Student object with full details

- `PUT /api/accounts/students/{id}/`
  - Update student information
  - Request: Updated student fields

## Course Management

### Courses

- `GET /api/courses/courses/`

  - List all active courses
  - Query params:
    - `is_active`: Filter by active status
  - Response: Array of course objects with batch details

- `GET /api/courses/courses/{id}/`
  - Get specific course details
  - Response: Course object with batches and enrollment stats

### Batches

- `GET /api/courses/batches/`

  - List all visible batches
  - Query params:
    - `course`: Filter by course ID
    - `is_visible`: Filter by visibility
  - Response: Array of batch objects

- `GET /api/courses/batches/{id}/`
  - Get specific batch details
  - Response: Batch object with student count and other details

## Enrollment Management

### Enrollment Process

1. `POST /api/enrollments/enrollments/initiate/`

   - Initiate enrollment process
   - Request:
     ```json
     {
       "student": student_id,
       "batch": batch_id,
       "start_month": "YYYY-MM",
       "coupon_code": "optional"
     }
     ```
   - Response: Enrollment details with payment requirements

2. `POST /api/enrollments/enrollments/initiate_payment/`

   - Start bKash payment for enrollment
   - Request: Enrollment data from initiate response
   - Response: bKash payment URL and details

3. `POST /api/enrollments/enrollments/verify_and_complete_payment/`
   - Complete enrollment after payment
   - Request: Payment verification data
   - Response: Final enrollment confirmation

### Enrollment Management

- `GET /api/enrollments/enrollments/`

  - List user's enrollments
  - Query params:
    - `student`: Filter by student ID
    - `is_active`: Filter active/inactive
  - Response: Array of enrollment objects

- `GET /api/enrollments/enrollments/{id}/`
  - Get specific enrollment details
  - Response: Enrollment object with course/batch details

### Coupons

- `GET /api/enrollments/coupons/validate/`
  - Validate coupon code
  - Query params:
    - `code`: Coupon code
    - `admission_fee`: Optional
    - `tuition_fee`: Optional
  - Response: Coupon validity and applicable discounts

## Payment Management

### Invoice Payment

- `GET /api/payments/payments/pending_invoices/`

  - List pending invoices
  - Response: Array of unpaid invoices

- `POST /api/payments/payments/pay_invoice/`

  - Pay single invoice
  - Request: `{ "invoice_id": id }`
  - Response: bKash payment details

- `POST /api/payments/payments/bulk_pay_invoices/`
  - Pay multiple invoices
  - Request: `{ "invoice_ids": [ids] }`
  - Response: bKash payment details

### Payment Processing

- `POST /api/payments/payments/execute_bkash_payment/`

  - Execute bKash payment
  - Request: bKash payment ID
  - Response: Payment confirmation

- `GET /api/payments/payments/payment_history/`
  - Get payment history
  - Response: Array of completed payments

## Reports & Statistics (Admin Only)

### Financial Reports

- `GET /api/common/reports/financial_summary/`
  - Get financial statistics
  - Response: Summary of earnings, dues, trends

### Enrollment Reports

- `GET /api/common/reports/enrollment_statistics/`
  - Get enrollment statistics
  - Response: Enrollment counts, trends, distribution

### SMS Reports

- `GET /api/common/reports/sms_statistics/`
  - Get SMS delivery statistics
  - Response: Message counts, success rates, trends

## Common Features

### SMS Management (Admin Only)

- `POST /api/common/sms/send_single/`

  - Send individual SMS
  - Request: Phone and message details

- `POST /api/common/sms/send_bulk/`
  - Send bulk SMS
  - Request: Array of recipients

### Automation (Admin Only)

- `POST /api/common/automation/generate_invoices/`

  - Generate monthly invoices
  - Response: Generation status

- `POST /api/common/automation/send_reminders/`
  - Send payment reminders
  - Response: Reminder status

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
	"date_of_birth": "date",
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
	"admission_fee": "decimal",
	"tuition_fee": "decimal",
	"is_active": "boolean",
	"batches": "array of batch objects"
}
```

### Batch Object

```json
{
	"id": "integer",
	"course": "integer (course_id)",
	"name": "string",
	"timing": "string",
	"group_link": "string (optional)",
	"class_link": "string (optional)",
	"tuition_fee": "decimal (optional)",
	"is_visible": "boolean",
	"student_count": "integer"
}
```

### Enrollment Object

```json
{
	"id": "integer",
	"student": "integer (student_id)",
	"batch": "integer (batch_id)",
	"start_month": "date",
	"tuition_fee": "decimal",
	"is_active": "boolean",
	"coupon": "integer (optional)"
}
```

### Invoice Object

```json
{
	"id": "integer",
	"enrollment": "integer (enrollment_id)",
	"month": "date",
	"amount": "decimal",
	"is_paid": "boolean",
	"coupon": "integer (optional)"
}
```

### Payment Object

```json
{
	"id": "integer",
	"invoice": "integer (invoice_id)",
	"transaction_id": "string",
	"payment_id": "string",
	"amount": "decimal",
	"payment_method": "string",
	"status": "string",
	"payer_reference": "string",
	"payment_create_time": "datetime",
	"payment_execute_time": "datetime"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses include:

```json
{
	"error": "Error message",
	"details": {} // Optional additional details
}
```

## Authentication Headers

Include the JWT token in request headers:

```
Authorization: Bearer <access_token>
```
