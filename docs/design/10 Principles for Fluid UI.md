1. Motion Should Be Physics-Based, Not Time-Based
The default approach to animation on the web is time-based. Pick a duration, pick an easing curve, done. The problem is that a 300ms ease-in-out feels identical whether an element is travelling 4 pixels or 400. That uniformity is what makes it feel mechanical.

Physics-based motion uses spring dynamics instead. Stiffness, damping, and mass determine how an element moves. A spring animation has no set duration. It resolves when the energy dissipates. Nudge an element gently and it settles quickly. Fling it hard and it overshoots, oscillates, then comes to rest. The same spring definition produces different motion depending on the context that triggered it.

This is the foundation everything else builds on. Motion and React Spring both default to spring physics for good reason. SwiftUI’s animation system is built entirely on springs. Once you start working with them, fixed-duration transitions feel like placeholders. Functional, but lifeless.

Stiffness between 200 and 400 produces responsive, snappy motion for most UI elements. Damping of 20 to 30 gives a natural settle without excessive wobble. Drop the mass below 1.0 for lightweight elements like toggles and chips. Increase it above 1.0 for substantial elements like modals and sheets.

2. Every Animation Must Be Interruptible
Imagine tapping a button to open a sheet. The sheet starts sliding up. Halfway through, you realise you tapped the wrong thing and tap close. What happens next determines whether the interface feels responsive or sluggish.

In a non-interruptible system, the sheet finishes opening, then starts closing. That’s a full second of the interface doing something you didn’t ask for. In an interruptible system, the sheet reverses instantly from its current position, inheriting its velocity in the opposite direction. It feels like grabbing a physical object mid-flight.

This is arguably the single most important factor in perceived responsiveness. A 400ms animation you can interrupt feels faster than a 200ms animation that locks out input. Spring animations are inherently interruptible. You change the target and the spring recalculates from its current state. That alone is one of the strongest arguments for springs over CSS keyframes for anything user-triggered.

If the user can trigger a state change while an animation is playing, that animation must be interruptible. If you’re using @keyframes for interactive elements, audit whether those interactions can overlap. If they can, switch to springs or CSS transitions, which do allow mid-flight target changes.

3. Direct Manipulation Over Indirect Control
There’s a fundamental difference between tapping a close button to dismiss a sheet and swiping the sheet down to dismiss it. Both achieve the same outcome, but the swipe creates a sense of physical agency that the button can’t. The user isn’t telling the interface what to do. They’re doing it themselves.

Direct manipulation means letting users drag, swipe, pinch, and reorder elements rather than relying on buttons and toggles alone. During the gesture, the element should track the pointer at 1:1. If the user’s finger moves 40 pixels, the element moves 40 pixels. Zero latency. Zero interpretation.

The key is the release behaviour. On pointer release, capture the velocity of the gesture. A fast swipe downward should dismiss. A slow release near the top should snap back. The velocity at the moment of release bridges the gesture into the animation, creating a seamless handoff from human control to system response.

This applies more broadly than you’d expect. Bottom sheets, drawers, cards in a stack, reorderable lists, image galleries, dismissable notifications, sliders. Anywhere a user might instinctively try to grab something, direct manipulation should be available. Libraries like @use-gesture/react and Motion’s drag prop make this tractable without building gesture recognition from scratch.

4. Preserve Velocity Across Gesture Boundaries
When a user releases a dragged element, the system takes over. That moment of release is a boundary between two phases. Direct manipulation, where the user controls position. And animation, where the system controls position. If the animation starts from zero velocity regardless of how fast the user was moving, there’s a visible stutter. The element freezes before the animation kicks in.

Velocity preservation eliminates that. Capture the pointer’s velocity at the moment of release and pass it to the spring animation as the initial velocity. The spring starts with the energy the user imparted and dissipates it naturally. A fast flick produces overshoot and settle. A slow release produces a gentle glide. The motion matches the gesture that produced it.

This is what separates interfaces that feel like you’re touching real objects from ones that feel like you’re toggling states. The test is simple. Flick an element quickly and watch whether it overshoots. Then drag it slowly and release. If both produce identical animation, velocity isn’t being preserved.

Motion and React Spring both support velocity as an animation parameter. In vanilla implementations, track dx/dt during the final frames of the gesture and feed it into your spring function’s initial conditions.

5. Use Shared Element Transitions to Maintain Spatial Context
When a user taps a thumbnail and it expands into a full-screen view, the continuity of that expansion tells a spatial story. This detail view is the thing you just tapped, enlarged. Without that transition, the detail view just appears. A hard cut that forces you to re-establish where you are and what you’re looking at.

Shared element transitions maintain spatial context by animating elements that persist across view changes. A list item morphs into a detail card. A thumbnail grows into a hero image. A FAB transforms into a modal. These transitions communicate that navigation is expansion, not replacement.

The View Transitions API is the modern standard for this on the web. Assign matching view-transition-name values to elements that should persist across the transition and the browser handles the interpolation. For component-level transitions within a single page, Motion’s layoutId achieves the same effect. Two elements sharing a layoutId animate between each other when one mounts and the other unmounts.

When planning a navigation flow, identify which elements exist in both the source and destination views. Those get shared transitions. Everything else can fade or slide as a group. The shared elements act as spatial anchors that keep the user oriented.

6. Respond to Input Method, Not Just Screen Size
Responsive design traditionally means adapting layout to viewport width. Fluid interfaces take that further by adapting interaction patterns to the active input method. A hover-driven tooltip on desktop should become a long-press or tap on touch. Scroll-linked animations should respond to scroll velocity, not just scroll position. Pointer precision should influence target sizes.

The distinction matters because interaction models that work beautifully with a mouse can be broken on touch. And vice versa. Hover states that gate functionality are the obvious example. But there are subtler cases. Scroll-linked parallax that feels elegant on a trackpad can feel nauseating at touch scroll velocities. Dense click targets that work with a precise cursor become frustrating with a fingertip.

CSS Media Queries Level 4 gives you the tools. @media (hover: hover) for hover-capable devices. @media (pointer: fine) for precise pointers. @media (pointer: coarse) for touch. Use these to build interaction layers. Hover effects that enhance but never gatekeep. Touch targets that scale up on coarse-pointer devices. Scroll behaviours that adapt to input velocity.

For gesture handling across input types, @use-gesture/react normalises mouse, touch, and pointer events into a single API. So drag and swipe interactions work identically regardless of input device. CSS touch-action gives you fine-grained control over which gestures the browser handles versus which your code intercepts.

7. Animate Layout Changes, Don’t Teleport
When an element is removed from a list, the items below should slide up to fill the gap. Not teleport. When a new section expands, its siblings should ease aside to make room. Layout changes that happen instantly are one of the most common sources of visual jank on the web. They break the user’s spatial model without explanation.

The challenge is that DOM layout is synchronous. Add or remove an element and the browser recalculates positions in a single frame. Animating through these changes requires recording positions before the change, applying it, then animating from old to new.

This is the FLIP technique. First, Last, Invert, Play. Capture the element’s bounding rect before the DOM update. Apply the update. Capture the new rect. Offset the element to its old position using transform. Then animate the transform to zero. Motion abstracts this with its layout prop. Any element with layout automatically animates between position changes. AnimatePresence handles enter and exit animations so removed elements can animate out before unmounting.

AutoAnimate is a lighter option that adds layout animation to any container with a single function call. For full-page transitions, the View Transitions API captures a snapshot of the old state and crossfades to the new.

Keep layout animation durations between 200 and 350ms. Shorter and the motion feels jumpy. Longer and the interface feels sluggish. Spring physics with moderate stiffness (250 to 350) gives a natural settle.

8. Apply Progressive Resistance at Boundaries
Pull down on a scrolled-to-top iOS screen and you get the rubber-band effect. The content follows your finger, but at a diminishing rate. Pull a little and it tracks closely. Pull further and the resistance increases. Release and it snaps back. This progressive resistance communicates a boundary without blocking the gesture.

A hard stop feels like hitting a wall. Unrestricted overflow feels broken. Progressive resistance threads the needle. You’ve reached the edge, and the interface is acknowledging your gesture, but there’s nothing further in this direction.

The maths are straightforward. Apply a dampening function to the overscroll distance. A common formula is limit * (1 - exp(-offset / limit / elasticity)), which approaches the limit asymptotically as offset increases. Motion exposes this as dragElastic. A value between 0 (hard stop) and 1 (no resistance), with 0.2 to 0.4 being the sweet spot for most interactions.

Apply this anywhere the user’s gesture meets a boundary. Scroll containers at their limits. Draggable elements at their constraints. Pull-to-refresh. Bottom sheets at min and max height. Carousel edges.


9. Choreograph Sequences, Don’t Reveal Everything at Once
When a dashboard loads, should all 12 cards appear simultaneously? Or should they cascade in, top to bottom, each arriving 60ms after the last? The simultaneous approach reads as a blob. A wall of content appearing at once. The staggered approach gives each element a moment of attention, creates rhythm, and communicates craft.

Staggered animation is the difference between an interface that feels dumped onto the screen and one that feels assembled before your eyes. It also has a practical benefit. The first element appears sooner than it would if the system waited for all data before rendering everything, so perceived performance improves.

The implementation is simple. Apply an incremental delay to each element in a sequence. Keep individual animation durations consistent. Only the start time varies. Motion’s staggerChildren handles this declaratively. In CSS, use animation-delay driven by a custom property (calc(var(--i) * 60ms)). GSAP’s stagger utility offers fine-grained control over patterns including from-centre and random distributions.

A stagger delay of 40 to 80ms per element hits the sweet spot. Cap the total sequence at roughly 600ms. So for 10 items with a 60ms stagger, the last item starts at 540ms and finishes around 900ms from the first item’s start. For lists longer than 8 to 10 visible items, stagger only the initially visible elements and render the rest instantly.

10. Respect the User’s Motion Preferences
Every principle above is subordinate to this one. If a user has enabled prefers-reduced-motion, they’ve made a deliberate choice. Often because motion on screen causes them physical discomfort. Vestibular disorders, migraines, seizure conditions. These can make the animations that feel delightful to most users feel hostile to others.

Honouring this preference doesn’t mean stripping the interface bare. It means replacing spatial animations (translation, scale, rotation) with non-spatial transitions (opacity, colour) that communicate the same state changes without triggering discomfort. A card that normally slides in from the right can fade in instead. A sheet that springs up from the bottom can crossfade into view. The functional communication is preserved. The vestibular trigger is removed.

In CSS, a global @media (prefers-reduced-motion: reduce) rule that sets animation and transition durations to near-zero handles the broad strokes. In component code, Motion’s useReducedMotion() hook lets you conditionally swap spring transitions for instant ones. The important thing is that every animated component has a reduced-motion path. Not as an afterthought. As a first-class variant.

The standard to hold yourself to: enable prefers-reduced-motion on your development machine and navigate your entire interface. It should feel complete, usable, and intentional. Quieter, but not broken. If any flow feels confusing without motion, that’s a signal the motion was doing structural work that needs a non-motion fallback.

Putting It Into Practice
These principles aren’t a checklist to apply after the fact. They’re a way of thinking that shapes decisions from the start. When you’re sketching a new interaction, ask: can this be directly manipulated? When you’re wiring up a state change, ask: what happens if the user triggers another change mid-animation? When you’re building a list, ask: what do the siblings do when an item is removed?

The tools are mature. Motion covers the majority of cases in React. The View Transitions API is landing across browsers. CSS Scroll-Driven Animations bring scroll-linked effects into the declarative layer. @use-gesture/react handles cross-input gesture normalisation. Spring physics are built into every modern animation framework.

The gap between a good interface and a fluid one isn’t talent. It’s attention. Noticing that a transition feels dead because it starts from zero velocity. Catching a layout jump that happens in a single frame. Testing with reduced motion enabled and realising a flow doesn’t make sense without spatial context.

Fluid interfaces reward that attention. They’re the ones users reach for instinctively, navigate without thinking, and describe as feeling right without being able to explain why.









Source: https://karlkoch.me/writing/10-principles-for-fluid-ui