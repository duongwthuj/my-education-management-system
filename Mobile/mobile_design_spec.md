# Mobile App Design Specification: LMS Connect

> [!NOTE]
> This document serves as a blueprint for the mobile development team to port the existing LMS Connect Web application to a Flutter-based mobile app.

## 1. Executive Summary
The goal is to create a companion mobile application for the LMS Connect platform. While the web version serves as a comprehensive management dashboard (Admin/Teacher views), the mobile app will focus on **on-the-go access**, **quick actions**, and **personal schedule management**.

**Target Platform**: Android & iOS (via Flutter)
**Core Design Philosophy**: Mobile-First, Clean Architecture, Minimalist UI.

---

## 2. Technical Architecture

### 2.1 Framework & Pattern
-   **Framework**: Flutter
-   **Architecture**: **Clean Architecture** (Presentation, Domain, Data layers).
-   **State Management**: **BLoC** (Business Logic Component).
-   **Dependency Injection**: `get_it` + `injectable`.

### 2.2 Project Structure
The project structure corresponds to the existing `mobile_app` setup:
```
lib/
├── core/               # Shared utilities, extensions, network clients
├── features/           # Feature-based folders
│   ├── auth/           # Login, Register
│   ├── dashboard/      # Home screen, Stats
│   ├── schedule/       # Calendar, Timetable
│   ├── teachers/       # Teacher directory (Admin/View)
│   ├── requests/       # Leave requests, Offset classes
│   └── profile/        # User settings
└── main.dart           # App entry point
```

### 2.3 Data Layer
-   **API Client**: Dio (for HTTP requests).
-   **Endpoints**: Reuse existing Web endpoints (look at `Web/src/services`).
-   **Local Storage**: `flutter_secure_storage` (for JWT tokens) + `shared_preferences` (for user settings).

---

## 3. UI/UX Adaptations (Web vs Mobile)

Key strategy: Convert **Desktop/Dense** views to **Mobile/Streamlined** views.

| Web Component | Mobile Adaptation | Notes |
| :--- | :--- | :--- |
| **Sidebar Navigation** | **Bottom Navigation Bar** | Use for top 3-4 destinations (Dashboard, Schedule, Menu). |
| **Data Tables** | **Card Lists** | Don't squeeze tables. Show key info in a card, tap to see details. |
| **Modals / Dialogs** | **Bottom Sheets** | Better reachability on mobile. Use full-screen for complex forms. |
| **Filters (Dropdowns)** | **Filter Sheet** | A "Filter" button opens a bottom sheet with options. |
| **Calendar (Month)** | **Agenda / Week View** | Full month is too small. Default to Agenda or 3-Day/Week view. |

---

## 4. Feature Roadmap & Porting Strategy

### Phase 1: Foundation & Personal Access (Current Priority)
Focus: Letting users log in and see *their* status.
1.  **Authentication** (Existing):
    -   Login & Register pages.
    -   *Improvement*: Add Biometric Login (Fingerprint/FaceID) later.
2.  **Dashboard (Home)**:
    -   **Web**: Grid of cards with stats.
    -   **Mobile**: 
        -   **Header**: Greeting + Quick Profile access.
        -   **Summary Cards**: Horizontal scroll view of key stats (Total Classes, Hours, etc.).
        -   **Upcoming**: "Next Class" prominent card.
        -   **Notifications**: Recent activities list.
3.  **Navigation**:
    -   Implement Bottom Navigation Bar: `Home`, `Schedule`, `Notifications`, `Profile`.

### Phase 2: Schedule & Operations
Focus: Daily usage for teachers.
1.  **Schedule**:
    -   Web: Big Calendar.
    -   Mobile: 
        -   **Tab 1: Today**: Timeline view of classes for the current day.
        -   **Tab 2: Calendar**: Month dot view + List of selected day's events.
2.  **Leave Requests**:
    -   List View: specific status colors (Pending/Approved/Rejected).
    -   Create View: Simple form with DatePicker.
3.  **Offset & Supplementary**:
    -   View list of assigned extra classes.
    -   Accept/Reject functionality for teachers.

### Phase 3: Directory & Admin Features
Focus: Management (Admin) or Information lookup.
1.  **Teachers Directory**:
    -   Searchable list of teachers.
    -   Tap to view `TeacherDetails` (Contact info, schedule summary).
2.  **Subjects / Classes**:
    -   Read-only reference lists.

---

## 5. Detailed Screen Specifications

### 5.1 Dashboard (Home)
-   **Layout**: `CustomScrollView` with Slivers.
-   **Components**: 
    -   `SliverAppBar`: Expands/collapses with user avatar.
    -   `StatCarousel`: Helper widget for summary stats.
    -   `UpcomingClassCard`: High emphasis card logic.

### 5.2 Schedule
-   **Library Plan**: Use `syncfusion_flutter_calendar` or `table_calendar`.
-   **Views**: 
    -   *Day View*: Critical for seeing time gaps.
    -   *Agenda View*: Good for quick summary.

### 5.3 Forms (Create Requests)
-   **Input Fields**: Use customized `TextFormField` with consistent styling (rounded corners, specific border colors).
-   **Validation**: Real-time validation (same rules as Web).

---

## 6. Implementation Checklist for Mobile Team

- [ ] **Setup**: Ensure `flutter_bloc`, `dio`, `get_it` are configured.
- [ ] **Styles**: Port logical colors from `Web/tailwind.config.js` to `lib/core/theme/app_colors.dart`.
- [ ] **Assets**: Export SVGs/Icons from Web `assets` to Mobile `assets`.
- [ ] **API**: Create Dart models (`User`, `Class`, `Request`) mirroring Web interfaces.
