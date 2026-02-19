# Wraith

A high-performance, secure Matrix client built with **Quasar (Vue 3)** and **Rust Crypto**.


## Key Features

- **Modern Stack**: Built on Vue 3, Pinia, and Vite.
- **End-to-End Encryption**: Powered by `matrix-sdk-crypto-wasm` (Rust) for robust security.
- **Rich Chat**:
  - Auto-scrolling and smart input handling.
  - Encryption indicators (Shields).
  - User avatars with deterministic coloring.

## Tech Stack

- **Framework**: [Quasar Framework](https://quasar.dev/) (Vue 3)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Matrix SDK**: `matrix-js-sdk` + `matrix-sdk-crypto-wasm`
- **Styling**: SCSS + Quasar Variables

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Katyusha47/wraith.git
   cd wraith-matrix
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The app will run at `http://localhost:9000`.

## Build

To build for production (SPA):

```bash
quasar build
# or
npm run build
```

## Contributing

Contributions are welcome!

## Disclaimer

I made this project for my portfolio and learning purpose. I am not responsible for any misuse of this project.
This project is not intended for production use. But all of the code is open source and can be used for any purpose.

## License

MIT
