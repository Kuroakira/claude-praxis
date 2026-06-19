# Context — claude-praxis Glossary

Domain vocabulary for the understanding-artifact tools (`/guide`, `/research`). Glossary only — no implementation details.

## Diagram Axes

A guide's diagrams fall on one of two orthogonal axes. Naming the axis clarifies what a diagram is *for*.

### Flow axis

Diagrams that show things changing or moving over time: order of messages, state transitions, data handoffs. Arrows mean "happens next" or "data travels here."

Existing flow-axis diagram types: sequence player (UML / Stage), state diagram, architecture data-flow diagram.

### Structure axis

Diagrams that show static containment: what is *inside* what. No time dimension. The reader learns the shape of the system, not its behavior.

Introduced to fill a gap — before this, every guide diagram was on the flow axis.

## Containment diagram

The structure-axis diagram type. Nested boxes: a unit drawn inside the box of the unit that contains it. Each box is a real code location (directory / file / symbol) and carries a file reference.

A containment diagram may also carry **labeled relationship arrows** between boxes. Every arrow states its meaning:

- **Static dependency** — "uses", "imports", "extends"
- **Runtime data flow** — "dispatches", "reads", "notifies"

An unlabeled arrow is not allowed. Relationship arrows are what let a containment diagram act as an *index* into the flow-axis diagrams: a labeled edge here corresponds to a flow detailed step-by-step elsewhere in the guide.

### Level selection by target type

The containment hierarchy adapts to what is being explained, rather than always drawing four fixed levels:

- **Application / system** target → outer-to-inner: whole system + external actors, then deployable units, then modules.
- **Library / single module** target (e.g. Jotai) → the module-and-its-internals level is the main one. Deployable-unit levels do not exist and are not drawn.

A box must map to real code. The tool does not invent a hierarchy that the code does not have. A purely conceptual grouping box (no code behind it) is rare and drawn distinctly (dashed, no file reference).

## Orientation

Keeping the reader aware of *where in the whole* the current detail sits, while deep in detail. A known unmet need (the reader scrolls away from the overview and loses the big picture). Deferred — not addressed by the containment-diagram work. Candidate future solutions: a persistent mini-map or a semantic-zoom map.
