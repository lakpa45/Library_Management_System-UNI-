# Library Management System — Gantt Chart

This proposed 12-week plan starts on 1 September 2026. It covers the existing
system scope: student, librarian, and administrator workflows; physical and
digital books; loans; fines; wishlists; testing; and deployment.

```mermaid
gantt
    title Library Management System — 12-Week Project Plan
    dateFormat  YYYY-MM-DD
    axisFormat  %d %b
    excludes    weekends

    section Planning and Design
    Requirements and scope                 :a1, 2026-09-01, 5d
    Use cases and acceptance criteria       :a2, after a1, 4d
    Database and system architecture        :a3, after a1, 6d
    UI wireframes and navigation            :a4, after a2, 5d
    Design approved                         :milestone, m1, after a4, 0d

    section Foundation
    Express and PostgreSQL setup            :b1, after a3, 4d
    Database schema and migrations          :b2, after b1, 6d
    Authentication and role guards          :b3, after b1, 8d
    Shared layout and responsive styling    :b4, after a4, 8d

    section Core Features
    Book and category management            :c1, after b2, 8d
    Search, browse, and book details         :c2, after c1, 6d
    Member registration and approval        :c3, after b3, 7d
    Borrow, return, due dates, and fines     :c4, after c1, 10d
    Wishlist and cart                        :c5, after c2, 5d
    PDF upload and digital-book access       :c6, after c1, 7d
    Core features complete                   :milestone, m2, after c4, 0d

    section Dashboards
    Student dashboard                       :d1, after c3, 7d
    Librarian dashboard                     :d2, after c4, 7d
    Administrator dashboard                 :d3, after c3, 7d
    Email and password-reset workflows       :d4, after b3, 6d

    section Quality and Release
    Integration and smoke testing           :e1, after d2, 7d
    Security and upload validation           :e2, after c6, 5d
    Accessibility and responsive review      :e3, after d1, 5d
    User acceptance testing                  :e4, after e1, 5d
    Bug fixes and documentation              :e5, after e4, 5d
    Production deployment                    :milestone, m3, after e5, 0d
```

## Milestones

| Milestone | Target outcome |
|---|---|
| Design approved | Requirements, architecture, and interface direction agreed |
| Core features complete | Catalog, membership, circulation, wishlist, and digital books functional |
| Production deployment | Testing accepted, documentation complete, and system released |

> GitHub renders the Mermaid block as a visual chart. Change the start date or
> task durations in the block to adjust the schedule.
