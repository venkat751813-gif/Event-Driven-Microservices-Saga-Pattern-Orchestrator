React + TypeScript + Vite

A minimal and modern React + TypeScript project powered by Vite. It provides a fast development experience with Hot Module Replacement (HMR), TypeScript support, and ESLint.

🚀 Features
⚛️ React
🟦 TypeScript
⚡ Vite
🔥 Hot Module Replacement (HMR)
🧹 ESLint
📦 Modern frontend development setup
🛠️ React Plugins

This project can use either of the official Vite React plugins:

@vitejs/plugin-react — uses Babel (or Oxc with Rolldown Vite) for Fast Refresh.
@vitejs/plugin-react-swc — uses SWC for Fast Refresh and fast compilation.
⚛️ React Compiler

The React Compiler is not enabled by default because it can affect development and build performance. It can be added later when compiler-based optimizations are required.

🧹 ESLint

For production applications, the ESLint configuration can be extended with type-aware rules such as recommendedTypeChecked, strictTypeChecked, and stylisticTypeChecked. React-specific linting can also be added with eslint-plugin-react-x and eslint-plugin-react-dom.

📦 Installation
git clone <your-repository-url>
cd <project-folder>
npm install

▶️ Development

Start the development server:

npm run dev

🏗️ Production Build
npm run build

🔍 Lint
npm run lint

👀 Preview
npm run preview

📁 Project Structure
src/
├── assets/
├── App.tsx
├── main.tsx
└── ...

public/
package.json
vite.config.ts
eslint.config.js
tsconfig.json

💻 Tech Stack

React • TypeScript • Vite • ESLint

Built with React, TypeScript, and Vite. 🚀
