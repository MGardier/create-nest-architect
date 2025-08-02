# nest-architect

[![npm version](https://badge.fury.io/js/nest-architect.svg)](https://www.npmjs.com/package/nest-architect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" />

Generate NestJS applications with pre-configured architecture patterns and ready-to-use ORM/ODM setup.

## Installation

```bash
npm create nest-architect@latest my-app
```

## Quick Start

```bash
# Create your project
npm create nest-architect@latest my-app

# Navigate to project
cd my-app

# Install dependencies  
npm install

# Configure your database connection
# Edit .env file with your database credentials

# Start development
npm run start:dev
```

## Usage

When you run the command, you'll be prompted to choose:

```
? Choose your project architecture: 
  ❯ 🏷️   Featured Architecture
    🏛️   Clean Architecture

? Select the database type for your project:  
❯   🗃️    SQL
    📦   NoSQL

? Which ORM/ODM would you like to set up?
❯   📦   Prisma (SQL)
    📦   Mongoose (NoSQL)
```

## Architectures

### 🏷️ Featured Architecture
Organizes code by features/resources. Each feature contains all related files (controllers, services, entities) in its own folder.

**Template:** [create-nest-architect-template-featured](https://github.com/MGardier/create-nest-architect-template-featured)

### 🏛️ Clean Architecture  
4-layer architecture that separates concerns and maintains independence from external tools and libraries.

**Template:** [create-nest-architect-template-clean](https://github.com/MGardier/create-nest-architect-template-clean)

## What You Get

- ✅ Pre-configured NestJS project with chosen architecture
- ✅ ORM/ODM setup with examples and best practices
- ✅ ConfigService configured for environment variables
- ✅ Ready-to-use project structure
- ✅ Example models and basic CRUD operations

## Requirements

- Node.js
- npm
- git
- Database (PostgreSQL, MySQL, MongoDB, etc.)

## Database Setup

### 📦 Prisma (SQL)

1. Configure your database provider in `prisma/schema.prisma`
2. Add your entities to the schema
3. Create `.env` file and set your `DATABASE_URL`
4. Run migration:
   ```bash
   npx prisma migrate dev
   ```
5. Start your application

📚 [NestJS Prisma Documentation](https://docs.nestjs.com/recipes/prisma)

### 📦 Mongoose (NoSQL)

1. Create your entities using Mongoose decorators (see generated examples)
2. Create modules with `MongooseModule` for each entity (see generated examples)
3. Create `.env` file and set your `DATABASE_URL` for MongoDB connection
4. Start your application

📚 [NestJS Mongoose Documentation](https://docs.nestjs.com/techniques/mongodb)

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

Missing an architecture pattern or ORM/ODM? Open an issue or submit a PR.

## Thanks

- [Mehdi Larek](https://github.com/LarekMehdi)
- [Amine SERRA](https://linkedin.com/in/amine-serra-5105b5252/)
- [Florian Forlini](https://www.linkedin.com/in/florianforlini/)

## License

MIT © [Your Name]