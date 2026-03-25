# Structural Pattern Review Points

Design pattern applicability checklist for recognizing when code structure warrants refactoring to well-known patterns. Derived from refactoring literature (Fowler, Gang of Four, Refactoring.guru) and teaching katas (GildedRose).

12 categories, 14 review points covering: Factory, Singleton, Observer, Strategy, State, Builder, Adapter, Decorator, Command, MVC, Repository, Polymorphism.

---

## General Principles

This catalog is **subordinate to simplicity rules** (`rules/code-quality.md` Simplicity Over Cleverness). If the simplicity catalog flags a pattern as unnecessary abstraction, that takes precedence. This catalog detects structural problems where patterns would reduce complexity — it does not advocate adding patterns to simple code.

Threshold: **evidence of current pain** (scattered duplication, multi-site modification, comprehension barrier), not anticipated future pain.

---

## 1. Scattered Type-Dispatching

### 1-1. Same type/kind check repeated across multiple methods
The same `if (type === "A") ... else if (type === "B")` conditional structure appears in 2+ methods or functions. Each location implements variant-specific behavior, making it easy to miss a variant when adding new ones.
→ **Polymorphism** (Replace Conditional with Polymorphism). Create a class hierarchy or interface where each variant implements its own behavior.
— Martin Fowler (Refactoring, 2nd Ed); Emily Bache (GildedRose Kata)

**Not warranted when**: The conditional appears in only one place (a single switch in a factory is fine). The variants are stable and unlikely to grow.

### 1-2. Adding a new variant requires modifying existing conditionals in multiple places
The most direct signal that conditional logic has outgrown its structure. A new item type, status, or category requires touching every method that branches on the type field.
→ **Polymorphism** or **Strategy**. Isolate variant behavior so new variants are additions, not modifications (Open/Closed Principle).
— Emily Bache (GildedRose Kata); Kent Beck ("Make the change easy, then make the easy change")

**Not warranted when**: The "multiple places" is actually just two small functions. The cost of introducing a class hierarchy exceeds the cost of the modification.

---

## 2. Algorithm Selection by Condition

### 2-1. if/switch selects among interchangeable algorithms
A conditional selects one of several algorithms that share the same interface (e.g., sorting strategies, pricing rules, validation approaches). The selection is typically made at configuration or initialization time and remains stable during operation.
→ **Strategy**. Extract each algorithm into a class implementing a common interface. The caller depends on the interface, not the concrete implementations.
— Refactoring.guru (Strategy pattern); sourcemaking.com

**Not warranted when**: Only 2 simple variants exist. The algorithms are trivially short (a few lines each) and unlikely to grow. An inline if/switch is clearer.

---

## 3. State-Dependent Behavior

### 3-1. Object behavior varies by internal state field checked in multiple methods
A status/phase/mode field (enum, string, or boolean) is checked in multiple methods to determine behavior. Methods contain `if (this.state === "connecting") ... else if (this.state === "connected")` patterns.
→ **State**. Replace the state field with a state object hierarchy. Each state implements the same interface, and the context delegates to the current state.
— Refactoring.guru (State pattern); Game Programming Patterns (Robert Nystrom)

**Not warranted when**: Only 2-3 states with simple, localized transitions. The state checks appear in only one method. The states are unlikely to grow.

### 3-2. State transitions scattered across methods with missing edge-case transitions
State transitions (e.g., connecting → connected, connecting → error) are implemented ad-hoc across multiple methods. Non-happy-path transitions (error during connecting, cancel during initializing) are missing or inconsistent.
→ **State Machine** (explicit transition table or State pattern with guarded transitions).
— Game Programming Patterns (Robert Nystrom)

**Not warranted when**: Transitions are simple and all fit in one method. A state diagram with fewer than 4 states and 6 transitions doesn't need a formal state machine.

---

## 4. Object Construction Complexity

### 4-1. Constructor or factory function with many parameters and conditional property setting
Object creation requires 5+ parameters, or a function builds an object with many conditional property assignments (`if (x) obj.a = ...; if (y) obj.b = ...`). The construction logic is hard to read and easy to get wrong.
→ **Builder**. Provide a fluent interface where each property is set by a named method, making construction self-documenting and order-independent.
— Effective Java (Joshua Bloch); Refactoring.guru (Builder pattern)

**Not warranted when**: The object has few properties and construction is straightforward. A simple object literal or named parameters suffice. The Builder itself would be more complex than the construction it replaces.

---

## 5. Creation Logic Scattered

### 5-1. Object creation with type-conditional logic duplicated in multiple locations
`if (type === "A") return new A(config); else if (type === "B") return new B(config);` appears in 2+ places. Adding a new type requires updating every creation site.
→ **Factory** or **Factory Method**. Centralize creation logic so type-to-class mapping exists in one place.
— Refactoring.guru (Factory Method pattern); Gang of Four

**Not warranted when**: Creation happens in only one place. The conditional is simple and the types are stable. A single creation function without a class hierarchy suffices.

---

## 6. Interface Incompatibility

### 6-1. Wrapper or translation code repeated for an external API
Multiple call sites manually translate between the application's internal interface and an external library's API. Each call site duplicates the same field mapping, format conversion, or error translation.
→ **Adapter**. Create a single adapter class that translates between the two interfaces. Call sites use the application's interface; the adapter handles the translation.
— Refactoring.guru (Adapter pattern); Gang of Four

**Not warranted when**: Only one call site exists. The translation is trivial (a single field rename). The external API matches the application's needs closely enough.

---

## 7. Feature Extension by Subclassing

### 7-1. Subclass explosion from combining independent features, or conditional feature ON/OFF
A class hierarchy grows exponentially because features are combined through inheritance (e.g., `EncryptedCompressedFileReader`, `BufferedEncryptedReader`). Alternatively, feature toggling is managed through boolean flags and conditionals.
→ **Decorator**. Wrap objects with decorator layers that each add one feature. Features compose independently without combinatorial subclassing.
— Refactoring.guru (Decorator pattern); Gang of Four

**Not warranted when**: Only one or two extensions exist. Inheritance is simpler and the combinations are fixed. The decorator chain would be harder to debug than the conditional.

---

## 8. Operation Management

### 8-1. Scattered state tracking for operation history, undo, or replay
Operation execution is interleaved with manual bookkeeping: saving previous state before each action, maintaining a history stack alongside business logic, or duplicating operation details for logging. The bookkeeping code is tangled with the operation code and grows with each new operation type.
→ **Command**. Encapsulate each operation as an object with execute/undo methods. Operations become first-class values that can be stored, queued, and reversed.
— Refactoring.guru (Command pattern); Gang of Four

**Not warranted when**: Operations are fire-and-forget with no undo, history, or logging. The bookkeeping is trivial (a single variable tracking the last action).

---

## 9. Event and Notification Chains

### 9-1. Manual notification calls when state changes
When an object's state changes, it explicitly calls specific dependents: `this.logger.log(); this.cache.invalidate(); this.ui.refresh();`. Adding a new dependent requires modifying the source object.
→ **Observer** (or event emitter/pub-sub). The source object emits events; dependents subscribe independently. Adding a new dependent doesn't modify the source.
— Refactoring.guru (Observer pattern); Gang of Four

**Not warranted when**: Only 1-2 dependents that are unlikely to change. The explicit calls are clearer than an event system. Event-driven debugging overhead exceeds the coupling cost.

---

## 10. Responsibility Mixing

### 10-1. UI rendering, business logic, and data access in one component/file
A single file or class handles user input, business rules, and data persistence. Changes to display logic risk breaking business rules; changes to data access require touching UI code.
→ **MVC** (or MVP, MVVM — the specific variant depends on the framework). Separate responsibilities into distinct layers: presentation, business logic, and data access.
— Derived from Clean Architecture (Robert C. Martin); framework conventions (React, Angular, etc.)

**Not warranted when**: The component is genuinely simple (a form that saves one field). Premature separation adds files without adding clarity. **Framework conventions take precedence** — React components, Vue SFCs, and similar frameworks intentionally co-locate concerns as a design choice. Only flag when co-location causes the file to exceed ~300 lines or when changes to one concern routinely break another.

---

## 11. Data Access in Business Logic

### 11-1. Database queries or ORM calls mixed with domain logic
Business logic functions contain SQL queries, ORM method calls, or direct API calls interleaved with domain computations. Testing business rules requires a database or external service.
→ **Repository**. Abstract data access behind an interface. Business logic depends on the repository interface; the implementation handles persistence details.
— Domain-Driven Design (Eric Evans); Patterns of Enterprise Application Architecture (Martin Fowler)

**Not warranted when**: The application is a simple CRUD with no meaningful business logic beyond data access. Adding a repository layer would just duplicate the ORM's interface.

---

## 12. Uncontrolled Global Access

### 12-1. Global state or resource accessed from scattered locations without coordination
A shared resource (database connection, configuration, logger) is accessed via global variables or module-level state from many unrelated parts of the codebase. Multiple instances would cause bugs, but nothing prevents it.
→ **Singleton** (or dependency injection, which is often preferable). Control access to the shared resource through a single well-defined point. Prefer DI container over classic Singleton for testability.
— Refactoring.guru (Singleton pattern); Gang of Four

**Not warranted when**: The resource is naturally module-scoped and doesn't need instance control. Dependency injection already manages the lifecycle. The access points are few and well-known. Note: prefer DI over classic Singleton for testability — classic Singleton introduces hidden global state.

---

## AI-Generated Code Patterns

| AI Code Tendency | Review Point |
|-----------------|-------------|
| Flat if/else chains for type-dispatching in multiple functions | 1-1, 1-2: scattered type-dispatching → Polymorphism/Strategy |
| if/switch selecting algorithm variant inline | 2-1: algorithm selection → Strategy |
| State field checked in every method | 3-1, 3-2: state-dependent behavior → State/State Machine |
| Long conditional property setting in object construction | 4-1: construction complexity → Builder |
| `new X()` with type conditionals in multiple places | 5-1: creation logic scattered → Factory |
| Direct external API calls without abstraction | 6-1: interface incompatibility → Adapter |
| Boolean flags controlling feature behavior | 7-1: feature extension → Decorator |
| Manual undo/history bookkeeping tangled with operations | 8-1: operation management → Command |
| Manual notification calls after state changes | 9-1: notification chains → Observer |
| UI/logic/data co-located in large components | 10-1: responsibility mixing → MVC |
| Business logic mixed with data access in handlers | 11-1: data access in logic → Repository |
| Global state accessed from scattered locations | 12-1: uncontrolled global access → Singleton/DI |
