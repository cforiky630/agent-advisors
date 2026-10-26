# Engineering Reference: Refactoring & Code Smell Catalog (Refactoring.Guru)

## Purpose & Primary Directive

This reference provides an operational engineering synthesis of the Refactoring.Guru code-smell taxonomy and refactoring technique catalog. Use it to diagnose structural friction, select the smallest behavior-preserving transformation, and avoid over-engineering traps.

**Primary Directive**: Never treat refactoring as an open-ended cleanup pass. Every refactoring must target a diagnosed code smell or maintenance bottleneck, execute in small verifiable steps, and strictly preserve observable behavior.

---

## 1. Core Refactoring Process & Discipline

- **The Two Hats Rule (Strict Separation)**: Never mix behavior changes (features or bug fixes) with structural refactoring in the same edit step or commit. Complete preparatory refactoring under existing tests first, then switch hats to add the feature.
- **The Rule of Three**:
  1. First occurrence: write the logic directly.
  2. Second occurrence: tolerate brief duplication if the underlying abstraction is not yet obvious.
  3. Third occurrence: extract and consolidate the shared responsibility. Never abstract coincidental similarity that will diverge for independent business reasons.
- **Small Behavior-Preserving Steps**: Apply named transformations incrementally so the codebase stays buildable and runnable between steps. If a transformation grows too wide to reason about locally, roll back and take smaller steps.
- **Diagnose -> Treat -> Verify -> Stop**:
  1. **Diagnose**: Name the exact smell and the maintenance friction it causes.
  2. **Treat**: Select the narrowest technique from the catalog that eliminates the smell without introducing shallower indirection.
  3. **Verify**: Run existing unit/characterization tests after each structural move. Never delete failing tests to make a refactor pass.
  4. **Stop**: Halt once the target smell is resolved and the pending change is straightforward. Record unrelated adjacent smells separately rather than cascading into an unbounded rewrite.

---

## 2. Complete Code Smell Taxonomy & Treatment Matrix

### A. Bloaters (Code that grew too large to comprehend or modify safely)

| Code Smell | Symptom & Friction | Preferred Refactoring Techniques | Fallback / Secondary Techniques | Exception / Over-Refactoring Trap |
| :--- | :--- | :--- | :--- | :--- |
| **Long Method** | Routine requires scrolling, comments, or mental state tracking across phases. | `Extract Method` | `Replace Temp with Query`, `Introduce Parameter Object`, `Preserve Whole Object`, `Replace Method with Method Object` | Do not split cohesive algorithms into 2-line shallow pass-through helpers that scatter control flow. |
| **Large Class** | Class owns too many fields, methods, or unrelated responsibilities. | `Extract Class` | `Extract Subclass` (variant behavior), `Extract Interface` (client-specific subset), `Duplicate Observed Data` | Do not split a class purely by line count if the extracted piece has no independent conceptual invariant. |
| **Primitive Obsession** | Raw strings, numbers, or arrays stand in for validated domain concepts or type codes. | `Replace Data Value with Object`, `Replace Magic Number with Symbolic Constant`, `Replace Array with Object` | `Replace Type Code with Class`, `Replace Type Code with Subclasses`, `Replace Type Code with State/Strategy` | Do not wrap primitives that carry zero validation, formatting, unit semantics, or domain behavior. |
| **Long Parameter List** | Signature exceeds 3–4 parameters or forces callers to memorize argument order. | `Replace Parameter with Method Call`, `Preserve Whole Object` | `Introduce Parameter Object` | Do not pass a whole object if doing so couples a low-level utility to a heavyweight domain entity. |
| **Data Clumps** | Identical groups of 3+ fields or parameters travel together across multiple signatures. | `Extract Class`, `Introduce Parameter Object` | `Preserve Whole Object` (and move clump-specific behavior onto the new object) | Do not group unrelated arguments into a generic `Context` or `Options` bag just to shorten signatures. |

### B. Object-Orientation Abusers (Incomplete or awkward application of OOP principles)

| Code Smell | Symptom & Friction | Preferred Refactoring Techniques | Fallback / Secondary Techniques | Exception / Over-Refactoring Trap |
| :--- | :--- | :--- | :--- | :--- |
| **Switch Statements** | Repeated `switch` or `if/else` chains branching on the same type code or mode across files. | `Extract Method` + `Move Method` (centralize decision) | `Replace Type Code with Subclasses` / `State/Strategy`, `Replace Conditional with Polymorphism`, `Replace Parameter with Explicit Methods`, `Introduce Null Object` | Keep a single honest `switch` or factory dispatch intact when polymorphism adds more classes than clarity. |
| **Temporary Field** | Instance fields are populated only during one specific method execution and sit empty otherwise. | `Extract Class`, `Replace Method with Method Object` | `Introduce Null Object` | Never normalize half-initialized objects whose validity depends on secret temporal call order. |
| **Refused Bequest** | Subclass inherits methods or data it does not use or overrides to throw `NotImplemented`. | `Replace Inheritance with Delegation` | `Push Down Method`, `Push Down Field`, `Extract Superclass` | Inheritance is acceptable if the subclass reuses behavior and truly satisfies Liskov Substitutability. |
| **Alternative Classes with Different Interfaces** | Two classes perform identical conceptual work under mismatched method names or signatures. | `Rename Method`, `Move Method`, `Add Parameter`, `Parameterize Method` | `Extract Superclass` (then delete redundant class) | Leave separate when classes belong to distinct external libraries that cannot be unified directly. |

### C. Change Preventers (Modifications in one place force edits across many locations)

| Code Smell | Symptom & Friction | Preferred Refactoring Techniques | Fallback / Secondary Techniques | Exception / Over-Refactoring Trap |
| :--- | :--- | :--- | :--- | :--- |
| **Divergent Change** | A single class is modified repeatedly for orthogonal reasons (e.g., DB, UI, and tax rules). | `Extract Class` (split by axis of change) | `Extract Superclass`, `Extract Subclass` | Do not split until at least two distinct reasons to change are observable. |
| **Shotgun Surgery** | A single conceptual requirement change forces tiny edits across many scattered classes. | `Move Method`, `Move Field` (consolidate into one owner) | `Inline Class` (collapse over-fragmented classes) | Do not add another pass-through coordinator that leaves the scattered edit sites intact. |
| **Parallel Inheritance Hierarchies** | Adding a subclass in hierarchy A always requires adding a mirrored subclass in hierarchy B. | `Move Method`, `Move Field` (fold one hierarchy into the other) | `Collapse Hierarchy` | Avoid creating paired handler/model hierarchies when composition or strategy injection suffices. |

### D. Dispensables (Pointless code whose removal makes the system cleaner and smaller)

| Code Smell | Symptom & Friction | Preferred Refactoring Techniques | Fallback / Secondary Techniques | Exception / Over-Refactoring Trap |
| :--- | :--- | :--- | :--- | :--- |
| **Comments (Explanatory)** | Comments narrate *what* confusing code is doing instead of why a decision was made. | `Extract Variable`, `Extract Method`, `Rename Method` | `Introduce Assertion` | Always keep comments that document *why*, non-obvious algorithmic tradeoffs, or external API quirks. |
| **Duplicate Code** | Identical or structurally parallel logic repeated in multiple routines or sibling classes. | `Extract Method` (same class), `Pull Up Method` / `Pull Up Field` (siblings) | `Form Template Method`, `Substitute Algorithm`, `Extract Superclass`, `Extract Class` | Prefer brief duplication over a convoluted flag-driven abstraction when two paths will evolve apart. |
| **Lazy Class** | A class no longer carries enough responsibility or state to justify its cognitive overhead. | `Inline Class` | `Collapse Hierarchy` | Keep small classes only when they enforce a security/architectural boundary or explicit Value Object invariant. |
| **Data Class** | Passive record with public fields or trivial getters/setters manipulated entirely by callers. | `Encapsulate Field`, `Encapsulate Collection`, `Move Method` (attract behavior) | `Remove Setting Method`, `Hide Method` | Immutable DTOs and Value Objects at serialization boundaries are valid; do not force persistence logic into DTOs. |
| **Dead Code** | Unreachable branches, unused parameters, obsolete fields, or unreferenced routines/types. | Delete unused code directly | `Inline Class`, `Collapse Hierarchy`, `Remove Parameter` | Verify reflection, serialization, public SDK exports, and dynamic plugin loading before deleting. |
| **Speculative Generality** | Unused hooks, abstract base classes, type parameters, or flags built "just in case". | `Collapse Hierarchy`, `Inline Class`, `Inline Method`, `Remove Parameter` | Delete unused fields/hooks | Keep extension points only when active external consumers or plugin contracts depend on them. |

### E. Couplers (Excessive coupling between classes or delegation that obscures responsibility)

| Code Smell | Symptom & Friction | Preferred Refactoring Techniques | Fallback / Secondary Techniques | Exception / Over-Refactoring Trap |
| :--- | :--- | :--- | :--- | :--- |
| **Feature Envy** | A method accesses another object's data far more frequently than its own. | `Move Method` (move whole method to data owner) | `Extract Method` + `Move Method` (move envying fragment) | Keep separate when using intentional `Strategy` or `Visitor` patterns to isolate varying algorithms. |
| **Inappropriate Intimacy** | Two classes reach into each other's private fields or maintain tight bidirectional links. | `Move Method`, `Move Field`, `Change Bidirectional Association to Unidirectional` | `Extract Class`, `Hide Delegate`, `Replace Inheritance with Delegation` | Never widen field visibility (`private` -> `public`) just to make a cross-class move compile. |
| **Message Chains** | Client code navigates deep object graph topology (`a.getB().getC().getD()`). | `Hide Delegate` | `Extract Method` + `Move Method` (push behavior down to the target owner) | Do not turn every intermediate object into a pure `Middle Man`; move the actual domain query instead. |
| **Middle Man** | A class consists predominantly of 1-line pass-through methods delegating to another object. | `Remove Middle Man` | `Inline Method`, `Replace Delegation with Inheritance` | Retain facades or adapters that intentionally enforce an Anticorruption Layer or simplify a complex subsystem. |
| **Incomplete Library Class** | A third-party library class lacks a needed helper and its source cannot be modified. | `Introduce Foreign Method` (1–2 helpers) | `Introduce Local Extension` (wrapper/subclass for substantial additions) | Do not scatter ad-hoc library workarounds across dozens of call sites. |

---

## 3. Refactoring Techniques Catalog & Execution Guardrails

### 1. Composing Methods
- **Catalog**: `Extract Method`, `Inline Method`, `Extract Variable`, `Inline Temp`, `Replace Temp with Query`, `Split Temporary Variable`, `Remove Assignments to Parameters`, `Replace Method with Method Object`, `Substitute Algorithm`.
- **When to Use**: A code block requires a comment to explain its intent, a local variable is reassigned for unrelated meanings, or deeply tangled local state prevents extracting sub-steps.
- **Safety Guardrail**: Before `Extract Method`, inspect all local variables read and mutated. Never extract a fragment that hides a state-mutating side effect behind an innocent query-like name.

### 2. Moving Features Between Objects
- **Catalog**: `Move Method`, `Move Field`, `Extract Class`, `Inline Class`, `Hide Delegate`, `Remove Middle Man`, `Introduce Foreign Method`, `Introduce Local Extension`.
- **When to Use**: Responsibilities are misallocated across classes, a class wears multiple functional hats, or callers are coupled to a collaborator's internal object graph.
- **Safety Guardrail**: Move state and the behavior that operates on it together. When applying `Extract Class`, ensure the new class hides its internal representation rather than forcing the original class to manipulate it via getters and setters.

### 3. Organizing Data
- **Catalog**: `Self Encapsulate Field`, `Replace Data Value with Object`, `Change Value to Reference`, `Change Reference to Value`, `Replace Array with Object`, `Duplicate Observed Data`, `Change Unidirectional Association to Bidirectional`, `Change Bidirectional Association to Unidirectional`, `Replace Magic Number with Symbolic Constant`, `Encapsulate Field`, `Encapsulate Collection`, `Replace Type Code with Class`, `Replace Type Code with Subclasses`, `Replace Type Code with State/Strategy`, `Replace Subclass with Fields`.
- **When to Use**: Raw primitives, magic literals, mutable collections, or string/integer type codes obscure domain invariants.
- **Safety Guardrail**: When applying `Encapsulate Collection`, always return a read-only view or defensive copy and provide domain-named mutation methods (`addItem`, `removeItem`) so callers cannot bypass invariants via `.push()` or `.clear()`. Prefer `State/Strategy` over `Subclasses` when the type code mutates at runtime.

### 4. Simplifying Conditional Expressions
- **Catalog**: `Decompose Conditional`, `Consolidate Conditional Expression`, `Consolidate Duplicate Conditional Fragments`, `Remove Control Flag`, `Replace Nested Conditional with Guard Clauses`, `Replace Conditional with Polymorphism`, `Introduce Null Object`, `Introduce Assertion`.
- **When to Use**: Deeply nested `if/else` arrows obscure the happy path, complex boolean expressions mask business intent, or repeated null/type checks clutter callers.
- **Safety Guardrail**: Before `Consolidate Conditional Expression`, verify all predicates are 100% side-effect-free and order-independent. Use `Introduce Assertion` strictly for internal programmer invariants—never for validating untrusted user input or expected runtime I/O failures.

```typescript
// SMELLY (Nested Conditionals, Control Flag, and Explanatory Comments):
function getPayAmount(emp: Employee): number {
  let result = 0;
  if (emp.isSeparated) {
    result = emp.separatedAmount();
  } else {
    if (emp.isRetired) result = emp.retiredAmount();
    else result = emp.normalPayAmount(); // normal calculation
  }
  return result;
}

// REFACTORED (Replace Nested Conditional with Guard Clauses):
function getPayAmount(emp: Employee): number {
  if (emp.isSeparated) return emp.separatedAmount();
  if (emp.isRetired) return emp.retiredAmount();
  return emp.normalPayAmount();
}
```

### 5. Simplifying Method Calls
- **Catalog**: `Rename Method`, `Add Parameter`, `Remove Parameter`, `Separate Query from Modifier`, `Parameterize Method`, `Replace Parameter with Explicit Methods`, `Preserve Whole Object`, `Replace Parameter with Method Call`, `Introduce Parameter Object`, `Remove Setting Method`, `Hide Method`, `Replace Constructor with Factory Method`, `Replace Error Code with Exception`, `Replace Exception with Test`.
- **When to Use**: Method signatures are misleading, mix state mutation with queries, use boolean mode flags, or leak construction complexity.
- **Safety Guardrail**: Enforce **Command-Query Separation** (`Separate Query from Modifier`) so methods returning values never cause hidden state mutations. Use `Replace Parameter with Explicit Methods` when a boolean flag parameter switches a function between two distinct behaviors.

### 6. Dealing with Generalization
- **Catalog**: `Pull Up Field`, `Pull Up Method`, `Pull Up Constructor Body`, `Push Down Method`, `Push Down Field`, `Extract Subclass`, `Extract Superclass`, `Extract Interface`, `Collapse Hierarchy`, `Form Template Method`, `Replace Inheritance with Delegation`, `Replace Delegation with Inheritance`.
- **When to Use**: Sibling classes duplicate logic, inheritance hierarchies are overly deep or half-empty, or subclasses violate superclass contracts.
- **Safety Guardrail**: Favor composition/delegation (`Replace Inheritance with Delegation`) whenever a subclass only wants to reuse code without honoring the superclass contract. Extract an interface only when multiple implementations or a test seam exist.

---

## 4. When Not to Refactor

1. **Scheduled Rewrite / Replacement**: When a component is slated for imminent retirement or clean-room replacement and existing behavior is already isolated behind a stable boundary.
2. **Untested Legacy Code Without a Seam**: Do not perform deep structural surgery on complex, untested code until you first establish a seam and lock down behavior with characterization tests.
3. **Hard Deadline / Critical Incident Mitigation**: During an active production outage or hotfix, apply the minimal contained fix first; schedule the structural refactoring as an immediate follow-up task.
4. **Cosmetic Churn ("Refactoring Theater")**: Do not rename internals, introduce design patterns, or reorganize directories when the code is already clear, stable, and not blocking an active change.

---

## 5. Verification Checklist

- [ ] **Smell Diagnosis**: Is the refactoring tied to a concrete code smell rather than subjective style preference?
- [ ] **Two Hats Separation**: Are structural transformations cleanly separated from behavioral changes?
- [ ] **Minimal Technique**: Did we pick the simplest catalog move without introducing shallow wrappers or premature polymorphism?
- [ ] **Encapsulation**: Are mutable collections, temporary fields, and type codes properly encapsulated behind intention-revealing methods?
- [ ] **Behavioral Parity**: Did all existing and characterization tests pass without deleting assertions?
