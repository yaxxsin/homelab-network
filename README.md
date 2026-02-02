# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Deployment

Aplikasi ini dapat dijalankan di server menggunakan Docker.

### Menggunakan Docker Compose (Direkomendasikan)

1. Pastikan Docker dan Docker Compose sudah terinstall di server Anda.
2. Jalankan perintah berikut di direktori proyek:
   ```bash
   docker-compose up -d --build
   ```
3. Aplikasi akan berjalan di `http://alamat-ip-server:3300`.

### Menggunakan Manual Build

Jika ingin menyajikan file secara manual tanpa Docker:
1. Jalankan `npm install`.
2. Jalankan `npm run build`.
3. Salin isi folder `dist` ke folder root web server Anda (misalnya di `/var/share/nginx/html`).

## Cara Update ke Server

Jika Anda melakukan perubahan pada kode dan ingin memperbaruinya di server:

1. Tarik (pull) perubahan terbaru ke server Anda (jika menggunakan Git):
   ```bash
   git pull origin main
   ```
2. Jalankan ulang Docker Compose dengan flag `--build` agar Docker membuat ulang image dengan kode terbaru:
   ```bash
   docker-compose up -d --build
   ```
   *Docker akan otomatis mematikan kontainer lama, membangun image baru, dan menjalankannya kembali.*

## Troubleshooting

### Error: `KeyError: 'ContainerConfig'`
Jika Anda menemui error ini saat update, biasanya disebabkan oleh versi `docker-compose` lama (v1) yang bentrok dengan metadata container baru.

**Solusinya:** Hapus container secara paksa sebelum menjalankan kembali:

1. Hapus container yang lama:
   ```bash
   docker rm -f homelab-network
   ```
2. Jalankan kembali:
   ```bash
   docker-compose up -d --build
   ```
3. (Opsional) Sangat disarankan untuk menggunakan perintah Docker V2 (tanpa tanda hubung) jika sudah terinstall:
   ```bash
   docker compose up -d --build
   ```
