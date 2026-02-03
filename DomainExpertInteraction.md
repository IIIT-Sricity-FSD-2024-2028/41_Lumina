# Summary of the interaction

## Basic information

    Domain:Education and Academic Administration(EdTech)
    Problem statement:Course Enrollment and Academic Planning
    Date of interaction: 31-01-2026(1st) & 01-02-2026(2nd)
    Mode of interaction: Video call
    Duration (in-minutes): 22 minutes(1st) & 28 minutes(2nd)
    Publicly accessible Video link:
    (1st) [Video Link](https://drive.google.com/file/d/1N5AMHNMic40dDIO-wTwmBNYDUPym4luH/view?usp=sharing)
    (2nd) https://www.awesomescreenshot.com/video/48963103?key=31db99a113386f6382efdd444c21c2e7

## Domain Expert Details

    Role/ designation (Do not include personal or sensitive information): (1st)Senior Software Engineer & (2nd)Web Developer
    Experience in the domain (Brief description of responsibilities and years of experience in domain): 
    Shubham Bansal has around 8–9 years of experience in the software engineering domain and is currently working as a Senior Software Engineer at Coursera. He has worked on backend and full-stack development, scalable system design, and building reliable software platforms.
    Kritiman Singh has approximately 6–7 years of experience in software development and works as a Software Developer. His experience includes backend application development, system integration, and building scalable software solutions using modern technologies.
    Nature of work: (1st) Developer & (2nd) Developer

## Domain Context and Terminology

- The overall purpose is to replace manual, error-prone registration methods—like Google Forms—with an automated centralized application that protects institutional data integrity. By transitioning to a rule based engine, we eliminate the need for manual verification of Prerequisites and Credit Requirements, ensuring that every Student enrollment is validated instantly against the Academic Roster capacities and Slot Allocation for courses are smooth and efficient.
- The primary goal is to achieve conflictless academic scheduling while empowering students to take ownership of their graduation timeline. Key outcomes include the real-time enforcement of Enrollment Constraints during the Enrollment Window, the elimination of data inconsistencies in final rosters, and the successful implementation of the Academic Roadmap to guide students through their complex Degree Requirements.

## Domain Terms

| Term                    | Meaning as explained by the expert                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| **Course_Slot**         | A specific recurring period in the weekly calendar assigned to a course to prevent scheduling overlaps. |
| **Academic_Roster**     | The official verified list of students registered for a specific course section during a given term.    |
| **Credit_Requirements** | The institutional boundary on the minimum or maximum credits a student can enroll in for a single term. |

## Actors and Responsibilities

| Actor           | Responsibilities                                                                              |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Student**     | Selects courses, validates prerequisites, and manages their own academic roadmap.             |
| **Faculty**     | Delivers instruction, manages syllabus details, and evaluates student performance via grades. |
| **Coordinator** | Sets enrollment dates, manages course catalog, and allocates course slots.                    |

## Core workflows

- **Enrollment Window Configuration**
  - **Trigger/start condition:** Academic calendar reaches the pre-registration phase.
  - **Steps involved:**
    1. Coordinator defines opening timestamp and closing timestamp.
    2. Access to courses is restricted by Prerequisites.
    3. The enrollment status is toggled to Active.
  - **Outcome / End condition:** The system becomes live for student registration.

- **Real-time Enrollment & Validation**
  - **Trigger/start condition:** A Student attempts to enroll in a specific course.
  - **Steps involved:**
    1. System checks Academic Roster for available seat capacity.
    2. System verifies that all mandatory Prerequisites are completed.
    3. System ensures the total semester credit does not exceed the Credit Limit.
  - **Outcome / End condition:** The seat is instantly reserved and the academic roster updated.

- **Strategic Academic Roadmap Generation**
  - **Trigger/start condition:** Student initiates long term planning from their dashboard.
  - **Steps involved:**
    1. System performs a Degree Audit to show pending requirements.
    2. Student drags future courses into a multi-semester timeline.
    3. System validates the plan against the Prerequisite.
  - **Outcome / End condition:** A validated Academic Roadmap is saved for future terms.

## Rules, Constraints, and Exceptions

- Mandatory rules or policies:
  - Student must complete specified amount of credit courses in a semester
  - Student must complete all Core Courses.
- Constraints or limitations:
  - Course enrollment is strictly limited by the physical seat capacity of course
  - The system must only allow enrollment during the authorized Enrollment Window.
- Common exceptions or edge cases:
  - Final-year students may request a Prerequisite waiver if a specific course is required for their target graduation date.
- Situations where things usually go wrong:
  - Popular electives often reach capacity within seconds of the Enrollment Window opening, leading to race conditions that manual Google Forms cannot handle fairly.

## Current challenges and pain points

- **Inefficiencies:** Manually verifying Prerequisites and Credit Requirements manually is slow and highly prone to human error.
- **Delays and Errors:** Significant delays occur when students submit forms for courses that are already full, requiring manual interventions.
- **Hardest Information to Track:** Real-time seat availability and waitlist management are nearly impossible to track manually once the enrollment phase begins.

## Assumptions & Clarifications

- **Confirmed Assumptions:** The system must act as a Gatekeeper, strictly blocking any Enroll action if the student’s academic history does not satisfy the Prerequisite.
- **Corrected Assumptions:** Faculty members have the authority to determine which students are permitted to enroll in a course.
- **Open questions:** What will happen in the case there is only one course left and a student does not meet the Prerequisite for it but he needs to that course to fullfill his Credit Requirements for that semester?
