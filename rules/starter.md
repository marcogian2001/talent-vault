# A.N. Sushi Academy – Career Opportunities Web App

App Name is: Talent Vault
Build a responsive web application for **A.N. Sushi Academy** that allows academy students to access curated **job opportunities** after completing an initial qualification quiz. The structure, hierarchy, and core components must follow the provided mockup, while the overall visual design must be strongly inspired by the landing page provided in `landing.png` (located in the root project folder). The final result should look like a seamless extension of the same brand ecosystem.

## Design Requirement (Very Important)

The application design must be consistent with the landing page found at:

- `/rules/landing.png`

This means following the same visual identity (colors, typography, spacing, tone, and overall aesthetic direction). The UI should feel premium, elegant, and minimal, with a strong brand presence. If the landing uses a dark theme, brushed metal textures, refined typography, or high-end spacing, the web app must reflect the same style language. Maintain layout rhythm and component styling coherence so that the web app feels like a natural continuation of the landing experience.

## Technical Stack Requirement

The base technical architecture is defined inside:

- `/rules/tech_stack.md`

This stack belongs to another application (Voxium AI). You do not need to implement everything from that stack, but you must follow its core architectural foundations, folder structure conventions, backend philosophy, configuration patterns, database modeling approach, and coding standards. The new app must feel structurally aligned with Voxium AI even if some parts of the stack are not used.

## Assets & Data Requirements

### Images

All images must be loaded exclusively from:

- `/photos`

Rules:
- Do **not** use external image providers.
- Do **not** use placeholder images.
- The filenames inside `/photos` correspond **exactly** to the opportunity names listed inside `opportunities.txt`.
- You must dynamically map each opportunity to its correct image using filename matching.

### Opportunities Source

All opportunity data must be seeded or parsed from:

- `/rules/opportunities.txt`

The data must be structured properly into the database/model and rendered dynamically in the UI.

## Application Flow

### 1) Quiz Page (Gated Entry)

The landing screen of the app should present the title:

- **Career Opportunities – A.N. Sushi Academy**

Users must complete a structured qualification quiz before accessing job listings.

Quiz sections must include:

1. **Engagement Type**
   - single service
   - seasonal
   - appointment
   - permanent position

2. **Day Pay / Compensation Filter**
   - A slider starting from minimum **250** up to unlimited
   - Must show:
     - selected range
     - **live count** of matching opportunities

3. **Operational Context**
   - Include contexts shown in the mockup (e.g., expedition cruises, etc.)

4. **Geographical Area**
   - Global
   - North Europe
   - Mediterranean
   - North America
   - Asia Pacific
   - Caribbean
   - Gulf Emirates & Middle East

5. **Opportunity Category (Selectable Chips)**
   - Private Chef
   - Boutique Hospitality
   - Fine Dining Omakase
   - Private Yacht
   - Resorts
   - Expedition Cruises
   - Consultancy
   - Ceremonies

CTA:
- **View Opportunities**

After submission:
- Save answers (session/local storage + database if needed, according to `tech_stack.md` conventions)
- Redirect to results page

### 2) Results Page (“Opportunities Available”)

Display title:
- **Opportunities Available**

Render a responsive grid of opportunity cards. Users must be able to dynamically adjust filters without retaking the quiz. The compensation slider must update the result count live.

Filters must include (at minimum):
- category
- geographical area
- engagement type
- compensation range/day pay

Each opportunity card must include:
- image from `/photos`
- a label overlay (e.g., Private Residency, Sushi Restaurant, Luxury Resort, Private Yacht, Expedition Yacht, Charter Yacht)
- structured details in key/value format (as shown in mockup)
- CTA buttons:
  - **Apply Now**
  - **Send Counter Proposal** (only if enabled for that opportunity)

Click behavior:
- Clicking a card should open either a detail modal or a detail page with full info (choose one, keep it consistent with the landing style).

## Data Model

Create a flexible `Opportunity` model.

### Core Fields
- `id`
- `category`
- `label_title`
- `image_path` (from `/photos`)
- `location`
- `country` (optional)
- `engagement_type`
- `compensation_text`
- `compensation_numeric` (for filtering)
- `currency` (optional)
- `tags` (array)
- `created_at`
- `allow_counter_proposal` (boolean)

### Optional Fields (depending on category)

**Private Chef / Villas**
- `position`
- `property_name`
- `guest_capacity`
- `accommodation_details`

**Restaurants / Omakase**
- `restaurant_name`
- `contract_type`
- `accommodation_included` (boolean)
- `benefits`

**Yachts / Cruises**
- `vessel_name`
- `flag`
- `crew_size`
- `max_guests`

## Apply Flow

The “Apply Now” action must open an application form with:
- name
- email
- phone
- notes
- CV upload (optional)

Submission should:
- Save to database and/or trigger an API endpoint according to the conventions in `tech_stack.md`.

If “Send Counter Proposal” is enabled, provide a simple form/modal that collects:
- proposed compensation
- availability window
- notes
and stores/sends it similarly.

## Expected Output

Deliver:
- fully working project
- clean architecture aligned with `tech_stack.md`
- seeded opportunities from `opportunities.txt`
- correct image mapping from `/photos`
- quiz gating + results + filters fully implemented
- UI consistent with `/landing.png`
- README with setup + run instructions (dev/build) and where to update opportunities/images