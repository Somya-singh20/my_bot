# Chatbot Project

A MERN-based chatbot that uses the Gemini API to provide AI-powered responses in real-time.

---

## Description

This project is a **full-stack chatbot** built with **MongoDB, Express, React, and Node.js (MERN)**.  
It allows users to interact with an AI bot through a web interface. The backend securely handles API requests, keeping your API keys safe.

**Features:**
- Real-time chatbot responses
- Secure API key management on the server
- Interactive web interface
- Easy to run locally or deploy

---

## Technologies Used

- **Frontend:** React, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **API Integration:** Gemini API

---

## Quick Start

Clone the repository and run the server and client:

```bash
git clone https://github.com/Somya-singh20/my_bot.git
cd my_bot

# Server
cd server
npm install
copy .env.example .env
# Add your Gemini API key in .env
npm run dev

# Client (in a separate terminal)
cd ../client
npm install
npx vite
