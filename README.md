# ⚡ Pulse

**A developer-focused CLI for authentication and command-line workflows.**

Pulse is a full-stack project that combines a command-line interface with a web application and authentication backend. It explores practical authentication workflows, including GitHub OAuth and device authorization.

<p align="center">
  <a href="https://www.npmjs.com/package/pulse-cli-divakar">
    <img src="https://img.shields.io/npm/v/pulse-cli-divakar?label=npm%20version&color=cb3837" alt="npm version" />
  </a>
  <a href="https://github.com/Divakar6368/Pulse">
    <img src="https://img.shields.io/github/stars/Divakar6368/Pulse?style=social" alt="GitHub stars" />
  </a>
</p>

## 📌 Project Links

- 📦 **npm Package:** https://www.npmjs.com/package/pulse-cli-divakar
- 💻 **GitHub Repository:** https://github.com/Divakar6368/Pulse
- 🌐 **Portfolio:** https://port-folio-three-neon.vercel.app/

## ✨ Features

- 🔐 Authentication powered by Better Auth
- 🐙 GitHub OAuth sign-in
- 💻 Device authorization workflow
- ⚡ Command-line interface built with Commander.js
- 🌐 Web application for authentication and device approval
- 🗄️ PostgreSQL database integration using Prisma
- 📦 Published npm package for easy installation

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| JavaScript / TypeScript | Application development |
| Node.js | Runtime environment |
| Next.js & React | Frontend |
| Express.js | Backend API |
| Better Auth | Authentication |
| GitHub OAuth | Social authentication |
| Prisma ORM | Database access |
| PostgreSQL | Database |
| Commander.js | CLI commands |

## 📥 Installation

Install Pulse CLI globally using npm:

```bash
npm install -g pulse-cli-divakar
```

Verify the installation:

```bash
pulse --version
```

View available commands:

```bash
pulse --help
```

## 🚀 Getting Started

Start the CLI:

```bash
pulse
```

To sign in, use the following command if supported by your installed version:

```bash
pulse login
```

Follow the instructions shown in your terminal and browser to complete authentication.

> **Note:** Authentication requires the Pulse backend and its OAuth configuration to be available.

## 💻 Run Locally

### Prerequisites

- Node.js and npm
- PostgreSQL database
- GitHub OAuth application credentials

### 1. Clone the repository

```bash
git clone https://github.com/Divakar6368/Pulse.git
cd Pulse
```

### 2. Start the backend

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory:

```env
DATABASE_URL="your-postgresql-connection-string"
BETTER_AUTH_URL="http://localhost:3004"
CLIENT_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

Use the exact environment variable names required by your project configuration. Never commit your `.env` file or expose your secrets.

Start the backend using the development script defined in `server/package.json`, commonly:

```bash
npm run dev
```

### 3. Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Use the scripts and environment variables defined in `client/package.json` and the client configuration.

Local development URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3004`

### 4. Configure GitHub OAuth

1. Create or configure a GitHub OAuth application.
2. Set the homepage URL to your frontend URL.
3. Set the authorization callback URL to the callback path configured in Better Auth.
4. Ensure the backend trusts the frontend origin.
5. Configure the production URLs separately when deploying.

Keep OAuth credentials private and preserve Better Auth's state and CSRF protections.

## 🔐 Device Authorization

Pulse includes a device authorization flow designed for CLI authentication.

Typical workflow:

1. Initiate authentication from the CLI.
2. Open the verification URL provided by the application.
3. Sign in through the browser.
4. Approve the device authorization request.
5. Continue using the CLI after authorization completes.

The exact commands and prompts depend on the installed version and server configuration.

## 📁 Project Structure

```text
Pulse/
├── client/              # Next.js frontend
└── server/              # Express backend and CLI
    └── src/
        └── cli/         # CLI entry point and commands
```

## 🗺️ Roadmap

- [ ] Improve onboarding and documentation
- [ ] Expand CLI capabilities
- [ ] Improve error handling
- [ ] Add automated authentication tests
- [ ] Improve release and version management

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome!

1. Fork this repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Submit a pull request.

Please do not commit secrets, environment files, or generated credentials.

## 📄 License

See the repository's `LICENSE` file for the applicable license terms.

## 👨‍💻 Author

**Divakar Patel**

B.Tech CSE Student | Full Stack Developer | MERN Stack Enthusiast

- GitHub: https://github.com/Divakar6368
- LinkedIn: https://www.linkedin.com/in/divakar-patel-09a264333
- Portfolio: https://port-folio-three-neon.vercel.app/

---

⭐ If you find Pulse useful, consider starring the repository on GitHub!

