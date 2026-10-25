# Run & Gun Arena

> A fast, browser-based run-and-gun arcade game built with React and Canvas.

[![Play the latest build](https://img.shields.io/badge/PLAY-LIVE%20DEMO-ffd166?style=for-the-badge&logo=github)](https://sangmiskar.github.io/run-and-gun-arena/)
[![Build](https://github.com/SANGMISKAR/run-and-gun-arena/actions/workflows/deploy.yml/badge.svg)](https://github.com/SANGMISKAR/run-and-gun-arena/actions/workflows/deploy.yml)

Choose a mission, fight through enemy waves, collect weapon upgrades, and take down the final boss. The game is designed to be playable in a browser with no install, account, or external game assets.

## Play

**[▶ Launch the live demo](https://sangmiskar.github.io/run-and-gun-arena/)**

The demo is deployed automatically from `main` with GitHub Actions. If the link is unavailable, enable **Settings → Pages → GitHub Actions** in the repository settings.

## Features

- Three missions with distinct color palettes, platforms, enemy mixes, and bosses
- Responsive canvas gameplay with keyboard and touch controls
- Grunts, jumpers, ranged enemies, weapon pickups, particles, and sound effects
- Pause, restart, victory, and game-over flows
- Original canvas-rendered visuals with no copyrighted characters, music, or level data

## Controls

| Action | Keyboard | Mobile |
| --- | --- | --- |
| Move | `A` / `D` or arrow keys | Direction buttons |
| Jump | `W` / `Space` | Jump button |
| Fire | `J` / `Z` | Fire button |
| Pause | `P` | Pause with keyboard |

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. Create a production build with:

```bash
npm run build
```

## Roadmap

- [x] Three playable missions
- [x] Enemy waves and boss encounters
- [x] Weapon pickups and touch controls
- [x] Pause and replay flow
- [ ] Online high scores
- [ ] More bosses and weapon types
- [ ] Controller support
- [ ] Accessibility options and reduced-motion mode

Have an idea? Open a feature request or submit a pull request.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, branching, and pull request guidance. Good starter contributions include new enemy behaviors, balance improvements, accessibility fixes, and visual polish.

## License

This project is open source. See [LICENSE](LICENSE) for details.
