# Parent Account Features

- Self registration using phone number (require sms verification).
- Self enrollment any child to available course and batch.
- Auto enrolment after payment of admission and 1st month fee.
- Option to apply coupon for admission fee waiver during enrolment and for tuition fee reduction anytime after enrolment.
- Any no. of students can be added to a student account
- Student profile needs to be added before enrolment.
- View and update each profile details
- Dashboard to view all details, including dues
- Option to pay fees for the current or previous months
- Receive sms reminder for payment on 3rd and 7th of each month if payment of that month is due.

## Parent Account Registration fields

- Phone (validate phone number, should be in this format: regex: /^01[2-9]\d{8}$/)
- Parent’s Name
- Address
- Facebook Profile Link (Validate facebook url)
- Email (optional)
- Password & Confirm Password (allow less secure passwords)

## Dashboard features

- Total payment due + option to pay (redirects to payment page)
- List of students added + option to add more
- Details of courses and batches enrolled under each student

## Payment page features

- Total dues
- Payment history table
- Columns: payment for (student name), payment for (month yy), course, payment status (paid / unpaid), amount, option (pay now / view invoice)

## Course Page features

- View course fee per month, and total due + option to pay
- View course group link
- View class join link
- View list of peers

## Profile page features

- Visit Parent profile.
- List of student profiles under the parent profile (with summary of student details)
- Clicking on a student or the parent shows the complete profile and provides option to update (also option to update password for parent profile)
- Option to add more student

## Add student page fields

- Student Name
- Date of Birth
- Class (optional)
- School (optional)
- Father’s Name
- Mother’s Name

## Parent account flow

- Registration:
  - User enters phone number, an otp is generated and sent to the user by sms after validating the number.
  - after the number is verified using otp, user enters Parent’s Name, Address, Facebook Profile Link, Email, Password, Confirm password and submits
  - Finally, the registration is recorded and the user gets logged in automatically and redirected to dashboard.
- If there’s no student added, the dashboard shows list of available courses and a prompt to add a student
- If they try to enroll to course without adding student, they gets redirected to adding a student
- After they add a student they can enroll to course. They select a course, and from the list of students they choose which student to enroll. The first student is selected by default.
- They select the month from which they will start their course. They will see the current month in option as well. They can apply coupon before continuing.
- When they continue, they are taken to bkash payment portal to pay the admission + first month fee.
- After completing the payment they get enrolled and gets access to the course page.

# Admin Account Features

- Login using the same endpoint as parent account
- Add courses, and batches under each course.
- Edit or remove courses or batches. But can only be removed if no students are enrolled in that course or batch. Even if it is removed previous data will be stored.
- Enroll or unenroll any student from any course.
- Move any student to any batch.
- Unenrolling a student from a course stops them from receiving payment reminders in sms or payment invoices in their payment page for that course. But preserve the previous records. Re-enrolling the student to the same course starts the process again.
- Specific monthly fee separately for each course, batch or student. Default fee for each batch and student will be the one set in the course, but can be modified separately for each student and batch. The modified student or batch will have a button to switch to default or specified. Changing the default fee won’t change for specified batch or student unless they are changed to default again.
- Hide a specific batch from parents / students who are not enrolled to that batch.
- Dashboard with summary of everything including earning, dues, students.
- View list of parent and student accounts and edit their profiles
- View payment history page for each student.
- View payment history for all students in a single table. (option to filter by month)
- Remove or Change the amount for any invoice that’s been generated already.
- Mark or Unmark any invoice as paid.
- Manually create invoice for any student.
- View activity log
- Send reminder to any student for the months they haven’t paid for using the Send reminder button.
- Option to send manual message.

## Registration system

- A specific phone number is hardcoded to be recognized as admin account whenever it is registered.
- Accounts that are already admins can add phone numbers to the list of admins. Only then their account will be promoted to admin accounts.

## Dashboard Features

- Total due all time
- Total due this month
- Total earning
- Total earning this month
- Total students
- Total courses
- Total batches

## Courses Page

- View list of courses
- Option to view and edit a course
- For each course option to edit batch
- For each batch see list of students, their tuition fee and option to specify tuition fee for each student, or switch back to default fee.
- Option to move a student to a different batch

## Students Page

- List of all students
- Filter by
  - Course
  - Batch
  - Month of admission
  - Enrolled to any of the courses (don’t show totally unenrolled students by default)
- Sort by
  - Alphabetic order
  - Month of admission
- Real-time ajax search by any information (name, parent name, phone, etc.)
- Clicking on a student takes admin to the student profile which includes:
  - Student and parent information
  - Admission details
  - Enrolled courses and batches
  - Option to specify fee for each of the courses they’re enrolled in or switch back to default fee
  - Option to unenroll from a course
  - Option to change batch
  - View Payment history for this student
  - Send reminder button
  - Send custom message button

## Payments page

### Due Payments

- Total dues
- Filter by:
  - Month
  - Student
  - Parent
  - Course
  - Batch
- Columns: student name, month, course, batch, amount, send reminder button, edit button
- Edit takes to editing the invoice where the amount can be changed or the invoice can be marked as paid.

### Payment history

- Total earnings
- Filter by:
  - Month
  - Student
  - Parent
  - Course
  - Batch
- Columns: student name, month, course, batch, amount, edit button.
- Edit takes to editing the invoice where the amount can be changed or the invoice can be marked as unpaid.

## Coupons page

- See list of coupons
- Add, edit or remove coupons

## Activity log page

- Filter by:
  - Type
  - Month
  - Day
  - User (Parent or Admin)

# Core

- More than one filters can be added simultaneously while viewing the tables which has filtering options.
- Payment invoices are generated one month advance. For example, if someone enrolls in January, they will see option to pay for February as well. And when February comes, invoice for March will be generated.
- Coupons are just automations that changes some values when applied.
- We will use a local provider ([\*\*Greenweb](http://www.greenweb.com.bd/))\*\* for sms gateway. Won’t use something like Twilio.

## Courses

- Name
- Image (Optional)
- Description (Optional)
- Admission fee
- Tuition fee

## Batches

- Name
- Timing
- Group Link (Optional)
- Class Link (Optional)
- Tuition fee derives from course by default but have option to specify

## Activity Log

- Logs major or critical activities with timestamp like:
  - Account creation
  - Student self Enrollment
  - Student Monthly Payment
  - Marking or unmarking payment
  - Adding, Removing or Editing course or batch
  - Enrolling/Unenrolling students
  - Specifying or updating monthly payment amount for specific students
  - Moving a student to a different batch
  - Sent payment reminder messages (both automated messages and manual)

## Coupons

- Name
- Code
- Expiration date
- Type
  - Discount (on monthly tuition fee)
  - Removal of Admission fee
  - Removal of tuition fee for first month
- A coupon can have multiple types together, and all changes will take affect when the coupon is applied. For example, a coupon can remove admission fee and also the tuition fee for the first month. But no one can get enrolled without paying anything. if the tuition fee for the first month is removed. The invoice will show 0 as amount and say paid. But they will require paying the 2nd month fee during enrollment.
