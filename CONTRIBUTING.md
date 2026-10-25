# Contributing to Run & Gun Arena

Thanks for helping make the arena better.

## Development setup

```bash
git clone https://github.com/SANGMISKAR/run-and-gun-arena.git
cd run-and-gun-arena
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run build
git diff --check
```

## Contribution guidelines

- Keep gameplay original and avoid copyrighted art, characters, music, or level data.
- Prefer small, focused pull requests with a clear player-facing result.
- Preserve keyboard and touch controls when changing gameplay.
- Keep the game playable without external services.
- Include reproduction steps for bugs and describe how you tested fixes.

## Good first contributions

- Add a new enemy behavior or weapon pickup.
- Improve game balance and difficulty pacing.
- Add accessibility or reduced-motion support.
- Improve mobile layout and touch feedback.
- Add visual effects that keep the canvas performant.

## Pull requests

Use a descriptive title and explain:

1. What changed for players.
2. How the change was tested.
3. Any tradeoffs or follow-up work.
