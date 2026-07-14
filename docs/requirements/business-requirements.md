# Business Requirements — Almanac

## What problem are we solving?

Makers who run home or small workshops have no purpose-built tool to manage their operations. They end up juggling supplies, products, orders, and finances across paper, spreadsheets, and generic tools like Notion — none of which talk to each other or understand how a workshop actually works.

The result is a fragmented operation: each area managed in isolation, with lots of friction and blind spots.

## What does Almanac do about it?

A SaaS platform that gives independent makers — regardless of craft type — a single place to run their workshop: manage supplies, cost and price products, track custom orders, and see whether the business is healthy.

## Who's involved?

- **Lethicia** — founder and first user. Her workshop is the pilot.
- **Mateus** — developer.
- **Future users** — other independent makers with the same type of workflow.

## What does success look like?

- **6 months:** Lethicia is running her entire workshop through Almanac with no parallel manual tracking.
- **12 months:** R$3,500–5,000/month in net profit from the platform.

## What's in v1?

### Authentication
- Login

### Workshop setup
- Set costs (one-time and periodic)
- Set hourly labor rate
- Set monthly working hours

### Supply management

Supplies are either **materials** or **tools**. For each:
- Register a supply item
- Register a purchase of a supply item
- Edit a supply item or one of its purchases
- Delete a supply item or its purchases

### Product catalog
- Register a product with a suggested price based on fixed and supply costs
- Differentiate between simple and complex products (a complex product is made up of simpler ones)
- Edit a product
- Delete a product

### Order management
- Create order
- Edit order
- Delete order

### Financial overview
- See revenue, costs, and margin across all orders
- See cash flow position (net result after fixed costs)
- See payment history

**Not in v1:** ready-stock POS flow, multi-user workshops, signup/password recovery, accounting integrations.

## Open questions

These need answers before certain parts of the system can be designed:

1. **Revenue model** — what's the pricing strategy? This determines whether the 12-month profit goal is realistic.
2. **Competition** — who else is solving this? Knowing this shapes how Almanac differentiates.
3. **Cost generalization** — Lethicia's workshop has specific cost logic for 3D printing vs. stationery. How should this generalize for other maker types?
