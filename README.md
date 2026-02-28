# **theMenu**  
### *Community-Driven Smart Pantry & AI Recipe Engine*

---

## Quick Setup Guide

### Prerequisites

Before setting up the project, ensure you have the following installed:

- **PHP** >= 8.0 with extensions: `pdo`, `mbstring`, `xml`, `bcmath`, `curl`
- **Composer** (PHP dependency manager)
- **MySQL** >= 5.7 or **MariaDB** >= 10.3
- **Node.js** >= 16.x and **npm** >= 8.x
- **Git**

### Installation Steps

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd theMenu
```

#### 2. Backend Setup (Laravel)

```bash
cd server

# Install PHP dependencies
composer install

# Copy environment file
copy .env.example .env    # Windows
# cp .env.example .env    # Mac/Linux

# Generate application key
php artisan key:generate
```

#### 3. Database Configuration

**Option A: MySQL (Recommended for Production)**

1. Create a MySQL database:
```bash
Create a database named 'themenu'
Copy the queries from 001_init_tables.sql and run it
```

2. Edit `server/.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=themenu
DB_USERNAME=root
DB_PASSWORD=
```

3. Create the migrations table:
```bash
php artisan migrate:install
```

#### 4. Frontend Setup (React + Vite)

```bash
cd ../client

# Install Node.js dependencies
npm install

# Copy environment file if needed
copy .env.example .env    # Windows (if exists)
```

#### 5. Start Development Servers

**Terminal 1 - Backend (Laravel):**
```bash
cd server
php artisan serve
# Server runs at http://127.0.0.1:8000
```

**Terminal 2 - Frontend (React):**
```bash
cd client
npm run dev
# App runs at http://localhost:5173
```

#### 6. Verify Setup

- Backend API: http://127.0.0.1:8000
- Frontend App: http://localhost:5173
- Test database connection:
```bash
cd server
php artisan migrate:status
php artisan tinker
# Inside tinker: DB::select('SHOW TABLES;')
```

### Common Issues

**"vendor/autoload.php not found"**
- Run `composer install` in the `server` folder

**"APP_KEY is missing"**
- Run `php artisan key:generate`

**Database connection errors**
- Verify MySQL is running
- Check `.env` credentials match your MySQL setup
- Ensure database exists: `CREATE DATABASE smart_recipe;`

**Port already in use**
- Laravel: `php artisan serve --port=8001`
- Vite: Edit `client/vite.config.ts` to change port

---

## Introduction

Every day, people buy groceries without fully planning their meals, leading to food waste, overspending, and decision fatigue in the kitchen. At the same time, many unique recipes remain undiscovered or unused within small groups of users.

**theMenu** is a community-driven AI-powered culinary platform that combines smart pantry management with a global recipe ecosystem. The system transforms personal inventory into intelligent meal suggestions while allowing users to contribute AI-generated recipes back to the global database.

Unlike traditional recipe apps, theMenu grows organically through community interaction and AI assistance.

---

## Project Vision

The main vision of **theMenu** is to:

- Connect personal pantry data with a global recipe database  
- Use AI to fill missing recipe gaps  
- Enable users to contribute new recipes to the community  
- Reduce food waste through intelligent matching  
- Maintain a fully normalized relational database (3NF)  
- Build a scalable, socially impactful culinary ecosystem  

---

## System Workflow

### 1. Bazar-to-Bin Inventory System (Smart Input)

After purchasing groceries, users update their digital pantry.

The system includes a **Smart Scan** feature where users can:

- Paste raw grocery lists or receipts  
- Automatically extract ingredient names  
- Predict quantities  
- Estimate expiry dates  
- Store data in the User Inventory table  

This eliminates manual data entry and ensures accurate tracking.

---

### 2. Matchmaker Engine (Database Discovery)

When users ask:

> "What can I cook right now?"

The system performs a **percentage-based matching query**.

It compares:

- User Inventory  
- Global Recipe Ingredients  

Results are ranked as:

- **100% Match** → Ready to Cook  
- **Partial Match (e.g., 70%)** → Missing some ingredients  
- Sorted by highest match percentage  

The system prioritizes recipes from the **Global Recipes Database** to promote community content.

---

### 3. AI Chef (Gap-Filling Engine)

If no suitable recipe exists in the database:

The user can trigger the **Generate AI Recipe** feature.

The AI will:

- Analyze available ingredients  
- Generate a structured professional recipe  
- Create title, ingredients list, and instructions  
- Mark it as AI-generated  
- Store it temporarily in the system  

This solves the common "No Results Found" problem.

---

### 4. Community Contribution System

After cooking and approving an AI-generated recipe, users can:

> Click "Share with Community"

The recipe is then:

- Moved from temporary state  
- Inserted into the Global Recipes table  
- Made available for all users  

Now, when other users have similar ingredients, the contributed recipe appears in their Matchmaker results.

This creates a **self-growing culinary ecosystem**.

---

## Refined Database Architecture (MySQL – 3NF)

The database separates:

- What exists globally  
- What exists in a user’s home  
- What is contributed by the community  

---

### Core Tables

**Users**
- user_id (PK)  
- username  
- email  
- password_hash  

**Master_Ingredients**
- ingredient_id (PK)  
- name  
- category  

(Global dictionary of all ingredients)

**User_Inventory**
- inventory_id (PK)  
- user_id (FK)  
- ingredient_id (FK)  
- quantity  
- expiry_date  

(Represents personal pantry items)

**Global_Recipes**
- recipe_id (PK)  
- created_by (FK → Users)  
- title  
- instructions  
- is_ai_generated (Boolean)  
- status (temporary / published)  

**Recipe_Ingredients**
- recipe_id (FK)  
- ingredient_id (FK)  
- amount_needed  
- Composite Key (recipe_id, ingredient_id)  

(Bridge table between recipes and ingredients)

---

## Matching Logic (Mathematical Model)

The system calculates recipe match percentage using:

\[
Match\% = \left( \frac{\text{Number of Ingredients Available in Inventory}}{\text{Total Ingredients Required in Recipe}} \right) \times 100
\]

This enables:

- Smart ranking  
- Efficient filtering  
- Transparent recommendation logic  

---


## Technology Stack

### Backend
- Node.js / Laravel  
- MySQL Database  
- RESTful API Architecture  

### Frontend
- React.js  
- HTML5  
- CSS3  
- JavaScript  

---

# Rendering Approach

## Client-Side Rendering (CSR)

This project uses **Client-Side Rendering only**.

All user interfaces are rendered in the browser.

### Frontend Responsibilities

- Page navigation  
- Dashboard rendering  
- Recipe filtering  
- Inventory updates  
- Analytics display  

### Backend Responsibilities

- API endpoints  
- Authentication  
- Database operations  
- Recipe matching logic  
- JSON data responses  

This architecture follows a modern **API-driven system design**.

---

## Security & Data Integrity

- Secure authentication system  
- Password hashing  
- Input validation  
- Database constraints  
- Protected API routes  
- Prevents duplicate ingredient entries  

---

## Expected Impact

- Reduction in household food waste  
- Smarter grocery utilization  
- Community-driven recipe growth  
- Scalable AI integration  
- Strong academic demonstration of Software Engineering & Database Design principles  

---

## Conclusion

**theMenu** is a next-generation community-driven AI culinary platform that combines:

- Intelligent pantry management  
- Percentage-based recipe matching  
- AI-generated gap filling  
- Global recipe contribution  

It transforms cooking from a solo activity into a shared, data-driven ecosystem that continuously evolves through user participation and artificial intelligence.
