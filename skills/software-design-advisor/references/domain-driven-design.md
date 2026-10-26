# Engineering Reference: Domain-Driven Design (Strategic & Tactical Modeling)

## Purpose & Primary Directive

This reference provides distilled engineering guidelines synthesized from Eric Evans's *Domain-Driven Design*. Use these rules to align software structure with complex business domains, protect invariants, and maintain explicit context boundaries.

**Primary Directive**: Optimize for a clear, expressive model of the business domain over generic reuse, CRUD convenience, or ORM/framework conventions. Apply rich tactical modeling where business rules and invariants are complex; use simpler patterns in supporting or generic subdomains.

---

## 1. Ubiquitous Language & Knowledge Crunching

- **Model-Driven Design**: Code structure, class names, method signatures, and tests must directly reflect the model used in domain discussions. If an abstraction cannot be implemented cleanly in code, refine the model rather than diverging code from domain speech.
- **Strict Vocabulary Discipline**: Inside a single Bounded Context, one domain concept maps to exactly one term, and one term never carries conflicting meanings. Replace vague technical placeholders (`Data`, `Manager`, `Processor`, `Info`, `flag`, `type`) with precise domain terms (e.g., `Cargo`, `Itinerary`, `HandlingEvent`, `RouteSpecification`, `OverbookingPolicy`).
- **Continuous Knowledge Crunching**: Treat awkward conditionals, contradictory naming, and special-case workarounds as signals of a shallow model. Evolve code names immediately when domain understanding deepens.
- **Scenario Walkthroughs**: Validate model boundaries by walking through concrete business scenarios end-to-end before committing to persistence schemas.
- **Making Implicit Concepts Explicit**: Promote hidden business constraints, domain processes, and complex predicates into first-class domain objects:
  - **Explicit Constraints**: Extract invariant rules into dedicated methods or objects rather than burying boolean arithmetic inside procedural handlers.
  - **Domain Processes**: When a multi-step business algorithm or policy has domain meaning (e.g., freight routing or tax allocation), model it explicitly as a Domain Service or Policy strategy rather than hiding it in infrastructure jobs.
  - **Specifications**: Represent combinable business rules (`AND` / `OR` / `NOT`) as explicit value predicates that evaluate eligibility, selection, or validation criteria in domain language.

---

## 2. Strategic Design: Subdomains, Bounded Contexts & Context Mapping

### Subdomain Classification & Distillation
Invest modeling rigor proportionally to strategic differentiation:
- **Core Domain**: The primary source of competitive advantage and complex business policy. Isolate from generic plumbing (`Segregated Core`), document with a lightweight `Domain Vision Statement`, highlight key abstractions (`Highlighted Core`), and apply rich tactical modeling.
- **Supporting Subdomain**: Custom to the business but non-differentiating. Keep models simple and pragmatic; avoid over-engineering.
- **Generic Subdomain**: Commodity capabilities (authentication, billing ledgers, notifications, cryptographic utilities). Prefer off-the-shelf packages, standard libraries, or separated `Cohesive Mechanisms`.

### Bounded Contexts & Continuous Integration
- Every domain model is valid strictly within an explicit **Bounded Context** kept internally consistent via **Continuous Integration** of concepts and terminology.
- Organize modules and packages by bounded context ownership first, not by horizontal technical layers (`controllers/`, `models/`, `utils/`).
- Never share a single monolithic "enterprise domain model" across independent contexts. If `Customer`, `Order`, or `Account` means different things in Sales, Billing, and Fulfillment, model each separately inside its own context.

### Context Mapping Patterns

| Pattern | Upstream / Downstream Dynamics | When to Use | Boundary Guardrails |
| :--- | :--- | :--- | :--- |
| **Anticorruption Layer (ACL)** | Downstream isolates itself from Upstream | Integrating with legacy systems, external vendors, or muddy upstream models. | Translate external DTOs, IDs, and status codes at the boundary via Facades/Adapters/Translators; never leak foreign types inward. |
| **Open Host Service (OHS)** | Upstream exposes a stable protocol | One context serves multiple downstream consumers needing standardized access. | Expose versioned integration endpoints decoupled from internal aggregate state shapes. |
| **Published Language (PL)** | Shared interchange contract (often paired with OHS) | Cross-context or external integration requiring a documented schema (JSON Schema, Protobuf, domain events). | Treat the schema as a public contract; map explicitly between internal domain objects and the published wire format. |
| **Shared Kernel** | Symmetric joint ownership | Two closely collaborating teams share a tiny, high-value model subset. | Keep the kernel minimal; run continuous integration tests across both contexts on every change. |
| **Customer-Supplier** | Upstream prioritizes Downstream needs | Two internal teams have clear dependency direction and shared governance. | Downstream defines acceptance tests for upstream contracts; schedule deliverables jointly. |
| **Conformist** | Downstream adopts Upstream model verbatim | Upstream will not adapt, and the foreign model is clean enough that an ACL adds no value. | Explicitly accept dependency on upstream types; isolate business additions around the imported model. |
| **Separate Ways** | Zero integration between contexts | Integration and translation costs exceed the business value of data sharing. | Duplicate or reconcile data externally rather than coupling independent subsystems. |

### Large-Scale Structure
Use minimally restrictive macro-structures (`Evolving Order`, `Responsibility Layers`, `Knowledge Level` for configurable meta-rules, or `Pluggable Component Framework` for mature variation points) only when they reduce cross-context cognitive load without freezing model evolution.

---

## 3. Tactical Building Blocks

| Building Block | Primary Responsibility | Identity & Mutability | Key Design Rules |
| :--- | :--- | :--- | :--- |
| **Entity** | Continuity and lifecycle transitions over time | Explicit stable ID; controlled state transitions | Expose intention-revealing domain methods (`rerouteCargo()`, `suspendAccount()`); forbid arbitrary public setters. |
| **Value Object** | Descriptive attribute group, quantity, or measure | Structural equality by value; **immutable** | Validate invariants at construction; implement side-effect-free operations that return new instances; eliminate Primitive Obsession. |
| **Aggregate & Root** | Transactional consistency boundary | Root has global ID; internal entities have local ID | Keep aggregates small; mutate strictly through the Aggregate Root; reference external aggregates **by ID only**. |
| **Domain Service** | Stateless domain operation across multiple objects | Stateless | Name after ubiquitous language activities or policies; never strip behavior from Entities just to create procedural `*Service` classes. |
| **Domain Event** | Record of a state-changing fact that occurred | Immutable value with timestamp & correlation IDs | Name in past tense (`OrderConfirmed`, `CargoMisdirected`); use to trigger eventual consistency across aggregates or contexts. |
| **Repository** | Collection-like illusion for Aggregate Roots | Interface in domain; adapter in infrastructure | Define **one repository per Aggregate Root** (never per database table); encapsulate query/ORM mechanics; return fully valid aggregates. |
| **Factory** | Encapsulate complex creation invariants | Stateless or Aggregate method | Guarantee atomic valid construction; separate new-instance invariant checks from storage reconstitution. |
| **Specification** | Composable predicate encoding a business rule | Immutable value predicate (`isSatisfiedBy`) | Use for validation, in-memory selection, or building criteria without scattering duplicate boolean expressions. |

### Aggregate Invariants & The Small-Aggregate Rule
1. **True Invariants Only**: Group entities and value objects into one aggregate only when a business invariant requires them to be transactionally consistent at the exact same millisecond.
2. **Small Boundaries**: Default to single-entity aggregates plus value objects. Oversized object-graph aggregates cause database lock contention and scalability bottlenecks.
3. **Encapsulated Internals**: External callers may hold references only to the **Aggregate Root**. Never return mutable internal collections (`ReadOnlyArray` or defensive copy only).
4. **Single-Aggregate Transactions**: Modify one aggregate instance per transaction by default; coordinate cross-aggregate updates asynchronously via **Domain Events** and eventual consistency.

```typescript
// VULNERABLE (Anemic Model & Exposed Collection):
order.items.push(newItem);
order.status = "CONFIRMED"; // Bypasses credit limit and empty-order invariants

// DEFENSIVE (Aggregate Root Enforcing Invariants & Emitting Domain Events):
export class Order {
  private readonly items: OrderLine[] = [];
  private status: OrderStatus = OrderStatus.Draft;

  public addItem(product: ProductId, quantity: Quantity, unitPrice: Money): void {
    this.assertModifiable();
    this.items.push(new OrderLine(product, quantity, unitPrice));
  }

  public confirm(creditPolicy: CreditPolicy): OrderConfirmed {
    this.assertModifiable();
    if (this.items.length === 0) throw new EmptyOrderError(this.id);
    if (!creditPolicy.isSatisfiedBy(this.totalAmount())) throw new CreditLimitExceededError(this.id);
    this.status = OrderStatus.Confirmed;
    return new OrderConfirmed(this.id, this.totalAmount());
  }
}
```

### Repositories, Factories & Layered Isolation
- **Repositories vs. DAOs**: A Repository speaks the Ubiquitous Language (`findOverdueInvoices(asOfDate)`), operates strictly on Aggregate Roots, and hides ORM/SQL representation. Never expose generic table-level CRUD or leak database row records into the domain.
- **Creation vs. Reconstitution**: Factories and constructors enforce full business invariants when creating new domain objects. Reconstitution from storage should assemble state without re-triggering creation side effects or domain events.
- **Layered Dependency Direction**:
  - **Domain Layer**: Pure business policies, aggregates, entities, value objects, domain services, specifications, and repository interfaces. Zero imports from web frameworks, ORMs, or transport SDKs.
  - **Application Layer**: Thin use-case orchestration (load aggregate -> invoke domain method -> persist via repository -> publish events). Must not own core business branching rules.
  - **Infrastructure & Interface Layers**: Persistence mappers, database drivers, message brokers, HTTP controllers, and ACL translators adapting external I/O to domain contracts.

---

## 4. Refactoring Toward Deeper Insight & Supple Design

Breakthrough models rarely appear on the first pass; they emerge by iteratively refactoring clunky procedural code toward **Supple Design**:
- **Intention-Revealing Interfaces**: Name classes, methods, and parameters after *what* business rule they accomplish, never *how* the underlying mechanism executes.
- **Side-Effect-Free Functions**: Isolate complex calculations and queries inside pure functions or Value Object methods that return results without mutating hidden state (Command-Query Separation).
- **Explicit Assertions**: Make post-conditions and state invariants explicit in constructors, aggregate roots, and automated tests so invalid states are unrepresentable.
- **Conceptual Contours**: Decompose classes and methods along natural domain boundaries that change together, avoiding both monolithic god objects and fragmented micro-classes.
- **Standalone Classes**: Minimize outgoing dependencies so core domain concepts can be understood and unit-tested in complete isolation.
- **Closure of Operations**: Where practical, define operations whose return type is the same as their argument type (e.g., `Money.add(Money): Money` or `DateRange.intersect(DateRange): DateRange`), enabling clean algebraic composition.
- **Breakthrough Migration**: When a sharper domain concept collapses multiple special-case workarounds at once, migrate toward the deeper model in small, behavior-preserving steps backed by scenario tests.

---

## 5. High-Risk DDD Anti-Patterns

1. **Anemic Domain Model**:
   - *Symptom*: Entities consist strictly of data fields and getters/setters while all business rules and validations reside in procedural `OrderService` or `AccountManager` classes.
   - *Fix*: Move state-validating rules and calculations into the Entity or Value Object that owns the data; reserve Domain Services for cross-aggregate operations.
2. **CRUD-Driven / Oversized Aggregates**:
   - *Symptom*: Designing aggregates to mirror relational foreign-key trees, ORM lazy-loading graphs, or UI form layouts, updating 5+ tables in one giant transaction.
   - *Fix*: Split along true invariant boundaries, replace direct object pointers between aggregates with typed IDs (`CustomerId`), and coordinate cross-aggregate workflows via Domain Events.
3. **Leaky Infrastructure & Persistence-First Modeling**:
   - *Symptom*: Domain entities inherit from ORM base classes, expose database column names, or double as JSON REST request/response payloads.
   - *Fix*: Keep the domain model persistence-ignorant; translate between transport DTOs, domain aggregates, and persistence models in outer layers.
4. **Accidental Shared Kernel (`common/domain`)**:
   - *Symptom*: Sharing domain entities across microservices or modules for convenience, coupling independent teams to a lowest-common-denominator schema.
   - *Fix*: Duplicate context-specific representations and translate explicitly via Published Language or Anticorruption Layers.
5. **Tactical DDD Ceremony on Simple CRUD**:
   - *Symptom*: Introducing factories, specifications, domain events, and custom mappers for trivial lookup tables or configuration endpoints.
   - *Fix*: Match pattern weight to domain complexity; use simple Transaction Scripts or active records for generic/supporting CRUD.

---

## 6. Verification Checklist

- [ ] **Ubiquitous Language**: Do class, method, event, and test names use exact bounded-context terminology without technical placeholders?
- [ ] **Context Boundaries**: Are foreign/external models translated explicitly via an ACL or adapter before reaching the domain core?
- [ ] **Rich Domain Behavior**: Are invariants enforced inside Entities, Value Objects, and Aggregate Roots rather than scattered across application services?
- [ ] **Small Aggregates**: Are aggregates minimal, mutated strictly via their Root, and referencing other aggregates by ID only?
- [ ] **Persistence Ignorance**: Is the domain layer free of ORM leaks, database schemas, and HTTP/transport DTO concerns?
- [ ] **Proportionality**: Is tactical DDD complexity reserved for genuine domain invariants rather than forced onto simple CRUD paths?
