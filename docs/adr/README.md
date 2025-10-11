# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the Collabrio project. ADRs document significant architectural decisions, their context, and consequences.

## Active ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-0001](adr-0001-record-architecture-decisions.md) | Record Architecture Decisions | Accepted | 2025-10-11 |
| [ADR-0002](adr-0002-extract-sharedaudiomanager.md) | Extract SharedAudioManager Utility Class | Accepted | 2025-10-11 |
| [ADR-0003](adr-0003-floating-icon-duplication-fix.md) | Floating Icon Duplication Bug Resolution | Accepted | 2025-10-11 |
| [ADR-0004](adr-0004-image-thumbnail-preview-system.md) | Image Thumbnail Preview System | Accepted | 2025-10-11 |
| [ADR-0005](adr-0005-include-username-in-file-events.md) | Include Username in File-Available Events | Accepted | 2025-10-11 |

## ADR Process

### Creating New ADRs
1. Copy the [ADR template](adr-template.md)
2. Use sequential numbering: `adr-NNNN-short-title.md`
3. Fill in all sections thoroughly
4. Submit for review (if working in team)
5. Update this index when accepted

### ADR Lifecycle States
- **Proposed**: Under discussion, not yet decided
- **Accepted**: Decision made and being implemented  
- **Deprecated**: No longer recommended, but not forbidden
- **Superseded**: Replaced by a newer ADR (link to replacement)

### When to Create ADRs
Create an ADR for decisions that:
- ✅ Affect system architecture or major design
- ✅ Involve technology selection or major dependencies
- ✅ Impact performance, security, or scalability
- ✅ Change development workflow or deployment process
- ✅ Establish coding standards or architectural patterns

Don't create ADRs for:
- ❌ Minor bug fixes or feature additions
- ❌ Temporary workarounds  
- ❌ Implementation details that don't affect architecture
- ❌ Decisions that are easily reversible

## Integration with Existing Documentation

**Current Documentation Structure:**
```
docs/
├── README.md                    # Quick start guide
├── ARCHITECTURE.md              # System overview
├── USER_STORIES.md              # Features and acceptance criteria
├── adr/                         # Architecture Decision Records (this directory)
└── archive/
    ├── decision-log.md          # Historical decision log (pre-ADR)
    └── detailed-spec.md         # Complete historical specification
```

**Cross-References:**
- ADRs link back to relevant sections in `archive/decision-log.md`
- New decisions documented as ADRs going forward
- Historical context preserved in decision log archive

## Tools and Resources

**Recommended Tools:**
- [adr-tools](https://github.com/npryce/adr-tools) - CLI for generating ADRs
- [ADR GitHub Template](https://github.com/joelparkerhenderson/architecture_decision_record)

**External Resources:**  
- [ThoughtWorks: Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
- [ADR Best Practices](https://github.com/joelparkerhenderson/architecture_decision_record/blob/main/examples/adr-template-by-thoughtworks.md)

## Migration from Decision Log

The historical `archive/decision-log.md` contains valuable decisions made before adopting ADRs:
- **DEC-001 through DEC-021**: Available in decision log archive
- **DEC-022+**: Converted to ADR format for easier reference
- **Cross-referencing**: ADRs link back to original decision log entries where applicable

This provides continuity while adopting industry-standard ADR practices going forward.