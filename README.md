##  Project Overview

A **full‑stack Task & Time Tracking System** designed to streamline work management and billing.

###  Key Features
- **Role‑based access control**
  - Admin and Employee dashboards with tailored permissions
- **Client management**
  - Maintain client records and associate tasks with specific clients
- **Task & Subtask management**
  - Create, assign, and track tasks with nested subtasks
- **Time logging with approval flow**
  - Employees log hours, admins review and approve before billing
- **Automated invoice calculation**
  - Generate invoices based on approved hours and hourly rates
- **Stripe sandbox payment integration**
  - Secure online payments with test mode support for development

---

### Tech Stack
- **Frontend:** React.js (role‑based routing),axios,tailwindcss
- **Backend:** Node.js / Express.js
- **Database:** MongoDB
- **Authentication:** JWT‑based secure login
- **Payments:** Stripe CLI & sandbox integration

---

### Why This Project?
This system helps teams and organizations:
- Track work hours with accountability
- Simplify client billing and payment collection
- Provide transparency with invoices and payment history
- Reduce manual errors with automated calculations and approvals

##  Setup Instructions

### 1️ Clone Repository
git clone https://github.com/Abi7r/madariz_office_administration_app.git 
cd project-folder
### 2 backend setup 
cd backend
npm install

## 3 configure environment variables
Create a .env file inside the backend folder
PORT=5000
MONGO_URI=mongodb://localhost:27017/<your_db_name>
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_xxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxx
FRONTEND_URL=http://localhost:5173

## 4 Start the Backend Server
npm start

## 5 Frontend Setup

cd frontend
npm install
npm start

## 6 configure Frontend environment variables  

VITE_STRIPE_PUBLIC_KEY = your Stripe publishable key   
VITE_API_URL = the backend API endpoint (local or deployed).  

###  Database Schema
The database design is illustrated in the ER diagram uploaded in the repo under the folder docs:

## Stripe Payment Sandbox Instructions
This project uses **Stripe Test Mode** with **Stripe CLI** for webhook testing.

### 1 Install Stripe CLI
Download and install from:  https://stripe.com/docs/stripe-cli

## 2 Stripe login
type stripe login in cmd/powershell

## 3 Run Webhook Listener
stripe listen --forward-to localhost:5000/api/payments/webhook
It will output something like:
whsec_123456789
Copy that value into your .env file
STRIPE_WEBHOOK_SECRET=whsec_123456789
Restart the backend after adding it.

## 4 Test Paymen
Use Stripe’s test card:
- Card Number: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any

##  API Documentation -Swagger

This project includes **Swagger UI** for interactive API exploration and testing.

###  Access Swagger Docs
Once the backend server is running, open:
http://localhost:5000/api-docs












