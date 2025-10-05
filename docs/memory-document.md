# Clippy the webRTC Chat - Memory Document

*Living documentation of project decisions, lessons learned, and organizational knowledge*  
*Last Updated: October 4, 2025*  
*References: [spec-document.md](./spec-document.md)*

## 🏢 Project Information

**Project Name:** Clippy the webRTC Chat with File Sharing  
**Description:** A WebRTC-based collaborative text editor with file sharing capabilities, featuring fallback to WebSocket for restricted networks  
**Team:** [To be updated as team members are identified]  
**Start Date:** October 4, 2025  
**Current Phase:** Planning  
**Repository:** /home/impressto/work/impressto/homeserver/www/homelab/clippy2  
**Live Demo:** [To be deployed]  

## 📋 Decision Log

### Technology Stack Selection
**Date:** 2025-10-04  
**Description:** Selected React for frontend and Node.js for backend socket server  
**Rationale:** React provides robust component-based architecture for real-time collaborative UI, Node.js enables efficient WebSocket handling and is well-suited for real-time applications  
**Status:** Decided  
**Impact:** High - Foundation for entire application architecture  
**Stakeholders:** Development team  
**Implementation:** To be implemented during development phase  

**Alternatives Considered:**
- **Vue.js + Express:** Considered but React has better WebRTC ecosystem support
- **Vanilla JS + Socket.io:** Would be lighter but more complex to maintain for collaborative features

**Follow-up Actions:**
- [ ] Set up React development environment (Dev Team - TBD)
- [ ] Create Node.js socket server structure (Dev Team - TBD)

---

### WebRTC with WebSocket Fallback Architecture
**Date:** 2025-10-04  
**Description:** Implement WebRTC as primary connection method with WebSocket fallback for restricted networks  
**Rationale:** WebRTC provides direct peer-to-peer communication with lower latency, but mobile networks often block it, requiring WebSocket fallback via socket.impressto.ca  
**Status:** Decided  
**Impact:** High - Core communication strategy affects all real-time features  
**Stakeholders:** Development team, end users on mobile networks  
**Implementation:** To be implemented with connection detection and automatic fallback  

**Alternatives Considered:**
- **WebSocket only:** Simpler but higher server load and latency
- **WebRTC only:** Better performance but would fail on restricted networks

**Follow-up Actions:**
- [ ] Implement WebRTC connection establishment (Dev Team - TBD)
- [ ] Create WebSocket fallback detection (Dev Team - TBD)
- [ ] Set up socket.impressto.ca server (Dev Team - TBD)

---

### Anonymous Usage Model
**Date:** 2025-10-04  
**Description:** No user authentication required, sessions accessible via URL hash  
**Rationale:** Simplifies user experience, reduces privacy concerns, faster session initiation  
**Status:** Decided  
**Impact:** Medium - Affects security model and user management  
**Stakeholders:** Development team, end users  
**Implementation:** Sessions identified by URL hash, no user accounts or authentication  

**Alternatives Considered:**
- **User accounts:** Would provide better session management but adds complexity
- **Guest accounts:** Middle ground but still adds unnecessary friction

**Follow-up Actions:**
- [ ] Design session URL hash generation (Dev Team - TBD)
- [ ] Implement session management without authentication (Dev Team - TBD)

---

### Frontend Build Tooling Selection
**Date:** 2025-10-04  
**Description:** Selected Vite as build tool and Yarn as package manager for React frontend  
**Rationale:** Vite provides fast development server with hot module replacement, optimized for modern React development. Yarn offers reliable dependency management and faster installs than npm  
**Status:** Decided  
**Impact:** Medium - Affects development workflow and build process  
**Stakeholders:** Development team  
**Implementation:** To be implemented during frontend setup  

**Alternatives Considered:**
- **Create React App + npm:** Traditional approach but slower dev server and larger bundle
- **Webpack + npm:** More configuration required, slower than Vite

**Follow-up Actions:**
- [ ] Initialize React project with Vite (Dev Team - TBD)
- [ ] Configure Yarn for package management (Dev Team - TBD)
- [ ] Set up development environment (Dev Team - TBD)

---

## 📚 Glossary

**WebRTC:** Web Real-Time Communication - Browser API enabling direct peer-to-peer communication for audio, video, and data  
**WebSocket:** Protocol providing full-duplex communication channels over a single TCP connection  
**Session Hash:** URL fragment used to identify and join collaborative sessions anonymously  
**Fallback Connection:** Secondary connection method (WebSocket) used when primary method (WebRTC) fails  
**Collaborative Text Editor:** Real-time shared document editing where changes from one user appear instantly for all participants  
**File Sharing:** Feature allowing participants to share files directly within the session  
**QR Code Sharing:** Method to share session URLs via QR code for easy mobile device access  

*Add all important terms, acronyms, and concepts that team members should understand*

## 🤝 Meeting Notes

### [Meeting Title]
**Date:** [YYYY-MM-DD]  
**Attendees:** [List of attendees]  
**Agenda:**
- [Agenda item 1]
- [Agenda item 2]
- [Agenda item 3]

**Notes:** 
[Main discussion points, decisions made, important information shared]

**Action Items:**
- [x] [Completed task] ([Assignee] - [Date])
- [ ] [Pending task] ([Assignee] - [Date])
- [ ] [Future task] ([Assignee] - [Date])

---

*Add more meetings using the same format above*

## 💡 Lessons Learned

### [Lesson Title]
**Date:** [YYYY-MM-DD]  
**Category:** [e.g., Technical, User Experience, Project Management, Team Dynamics]  
**Situation:** [What happened - context and circumstances]  
**Lesson:** [What was learned from this situation]  
**Application:** [How this lesson was applied or should be applied in the future]  
**Impact:** [High | Medium | Low] - [How this lesson affected the project or team]  

---

*Add more lessons using the same format above*

## 👥 Onboarding Notes

### [New Team Member Name] - [Role]
**Status:** [Active | Complete | On Hold]  
**Department:** [Department/Team]  
**Start Date:** [YYYY-MM-DD]  
**Mentor:** [Mentor name]  

**Technical Setup:**
- [ ] Development environment setup
- [ ] Repository access and permissions
- [ ] Required tools and software installation
- [ ] Understanding of build and deployment process

**Codebase Familiarity:**
- [ ] Project architecture overview
- [ ] Code style and conventions
- [ ] Key components and modules
- [ ] Testing practices and frameworks

**Feature Implementation:**
- [ ] First small bug fix or feature
- [ ] Code review participation
- [ ] Independent feature development
- [ ] Mentoring other team members

**Resources:**
- 📚 [Link to documentation]
- 📚 [Link to coding standards]
- 📚 [Link to project wiki]
- 📚 [Link to team processes]

**Notes:**
[Progress observations, strengths, areas for improvement, next steps]

**Next Goals:**
- [ ] [Specific goal 1]
- [ ] [Specific goal 2]
- [ ] [Specific goal 3]

**Completion Status:** [Percentage]% - [Brief status description]

---

*This memory document should be updated whenever significant decisions are made, lessons are learned, or team changes occur. It serves as both historical record and guidance for future development.*

---

## 🤖 AI Agent Instructions

When updating this memory document, please:

1. **Add new decisions** to the Decision Log with proper rationale and implementation details
2. **Update existing decisions** if their status changes (e.g., from Decided to Implemented)
3. **Add lessons learned** from recent project experiences, focusing on actionable insights
4. **Update meeting notes** with recent team meetings, decisions, and action items
5. **Maintain the glossary** by adding new terms and updating existing definitions
6. **Update onboarding notes** as team members progress or new members join
7. **Preserve the exact format** including emojis, sections, and field names for compatibility with Arcana
8. **Use the action item format**: `- [x] Task description (Assignee - Date)` for completed items
9. **Use the action item format**: `- [ ] Task description (Assignee - Date)` for pending items
10. **Keep the document current** by updating the "Last Updated" date at the top

**Format Requirements for Arcana Compatibility:**
- Section headers must use exact emoji format: `## 🏢 Project Information`
- Action items must follow format: `- [x] Description (Person - Date)`
- All field names like **Date:**, **Status:**, **Impact:** must be preserved exactly
- Maintain consistent indentation and bullet point formatting