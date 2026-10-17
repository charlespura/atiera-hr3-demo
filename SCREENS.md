# Screen inventory

The demo reproduces the main HR3 admin navigation. Source paths map each demo screen to its original PHP counterpart; PHP is not shipped or executed. Employee, attendance, claim and leave detail/edit screens use dialogs within these routes.

## Employee

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Employee MasterList | `#/employees` | `employee/employee.php` |
| Add Employee | `#/add-employee` | `employee/addemployee.php` |
| Newly Hired Employees | `#/new-hires` | `employee/employeeNewhired.php` |
| Department Type | `#/departments` | `employee/departmentType.php` |
| Position Type | `#/positions` | `employee/positionType.php` |

## Dashboard

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Hr3 Dashboard | `#/dashboard` | `timesheet/dashboard.php` |

## Time and Attendance

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Attendance Log | `#/attendance` | `timeAndattendance/time.php` |
| Attendance Anomaly | `#/anomalies` | `timeAndattendance/timeAnomaly.php` |
| Absence Management | `#/absences` | `timeAndattendance/absenceManagement.php` |
| Face Recognition | `#/face` | `timeCheck/clockin.php` |
| NFC Clock In / Out | `#/nfc` | `include/nfc.php` |
| CCTV Monitoring | `#/cctv` | `timeAndattendance/cctvMonitoring.php` |
| Allowed Locations | `#/locations` | `timeCheck/setOfficeLocation.php` |

## Shift & Schedule

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Assign Shift | `#/schedule` | `shift/assignShift.php` |
| View Shift | `#/schedules` | `shift/viewShift.php` |
| No Shift Employee | `#/no-shift` | `shift/noShift.php` |
| Shift Auto Balance | `#/auto-balance` | `shift/shiftAutoBalance.php` |
| View Request Shift | `#/shift-requests` | `shift/reqShift.php` |
| Add Shift | `#/shift-types` | `shift/addShift.php` |
| Request Type | `#/request-types` | `shift/reqType.php` |
| Status Type | `#/status-types` | `shift/statusType.php` |
| Holiday | `#/holidays` | `shift/holiday.php` |

## Timesheet

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Timesheet | `#/timesheets` | `timesheet/timesheet.php` |
| Report | `#/timesheet-report` | `timesheet/timesheetReport.php` |
| Timesheet 15 days | `#/timesheet-15` | `timesheet/timesheet15day.php` |
| Timesheet Sync | `#/timesheet-sync` | `timesheet/timesheetSync.php` |

## Leave Management

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Assign Leave | `#/leaves` | `leave/assignLeave.php` |
| Leave Balance | `#/leave-balance` | `leave/leaveBalance.php` |
| Employee Leave Balance | `#/employee-balances` | `leave/employeeLeaveBalance.php` |
| Leave Type | `#/leave-types` | `leave/leaveType.php` |

## Claims & Reimbursement

| Demo screen | Route | Original screen |
| --- | --- | --- |
| Employee Claims | `#/claims` | `claims/viewAssignClaim.php` |
| Assign Claims | `#/assign-claim` | `claims/claims.php` |
| Claims Summary | `#/claim-summary` | `claims/claimsSummary.php` |
| Event Type | `#/event-types` | `claims/eventType.php` |
| Expenses Type | `#/expense-types` | `claims/expensesType.php` |
| Claims Budget Summary | `#/claim-budgets` | `claims/claimsView.php` |

## User Management

| Demo screen | Route | Original screen |
| --- | --- | --- |
| User Profile | `#/users` | `user/userProfile.php` |
| User Log | `#/user-logs` | `user/userLog.php` |
| Create User | `#/create-user` | `user/createUser.php` |
| Role Type | `#/roles` | `user/roleType.php` |

## Settings

| Demo screen | Route | Original screen |
| --- | --- | --- |
| My Profile | `#/profile` | `user/profile.php` |
| Account & Security | `#/settings` | `user/setting.php` |
| PDF Password | `#/pdf-settings` | `user/pdfReportPassword.php` |
| Notification Management | `#/notification-management` | `settings/notificationManagement.php` |
| Email Settings | `#/email-settings` | `settings/emailNotification.php` |
| Monitoring & Maintenance | `#/health` | `settings/system_health.php` |
| Discord Management | `#/discord-settings` | `settings/discord_management_notification.php` |
| Module Status Detected | `#/modules` | `settings/module_name.php` |
| Email Dashboard | `#/email-outbox` | `settings/email_dashboard.php` |
| Notifications | `#/notifications` | `settings/viewNotification.php` |
| Notification Preferences | `#/preferences` | `settings/notificationPreferences.php` |
| Sync To Cloud | `#/sync` | `settings/syncToCloud.php` |
| Firestore Demo | `#/firebase` | `firebase-config.php` |
| API Explorer | `#/api` | `api/fullApi.php` |
| Audit Logs | `#/audit` | `HRSuperadmin/audit_logs.php` |
| System Help | `#/help` | `include/systemHelp.php` |
| Skills & Technology | `#/technology` | `skillAndTechnology.php` |
| Privacy Policy | `#/privacy` | `user/privacyPolicy.php` |
| Terms of Use | `#/terms` | `user/terms.php` |
| Mobile App Preview | `#/mobile` | `include/downloadApp.php` |

