# 🐼 Mafia Food: Tactical Meal Engineering

[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-Powered-blueviolet?style=for-the-badge&logo=google-gemini)](https://ai.google.dev/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

> **"Listen kid, I don't care if you're in a Tier-3 village or a Metro high-rise. Mafia Food ensures you're fed tactical, flavor-packed meals without blowing your budget. Lock in the mission intel and let's cook."**

Mafia Food is a high-stakes meal planning **Command Center** designed for users navigating strict budgets and limited resources. It transforms mundane grocery shopping and cooking into a high-precision tactical operation using the latest in Google Generative AI.

---

## 🗺️ Table of Contents

- [🎯 The Mission](#-the-mission)
- [⚡ Tactical Features](#-tactical-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [🎮 Operational Guide](#-operational-guide)
- [📂 Project Structure](#-project-structure)
- [🔒 Security & Privacy](#-security--privacy)
- [🤝 Credits & Reference](#-credits--reference)

---

## 🎯 The Mission

Most meal planners assume you have an unlimited budget and a fully stocked supermarket next door. **Mafia Food** assumes the opposite. It is engineered to:

*   **Save Capital**: Verify real-world price reality using **Google Search Grounding**.
*   **Optimize Cargo**: Scan your existing pantry using **Gemini Vision**.
*   **Navigate Sectors**: Find actual supply nodes (markets/shops) via **Google Maps Grounding**.
*   **Execute Precision**: Provide minute-by-minute cooking sequences tailored to your available time.

---

## ⚡ Tactical Features

### 🛰️ Dual-Mode Grounding (Search & Maps)
The app doesn't guess; it verifies. By utilizing **Google Search Grounding**, it fetches real-time market rates for ingredients in specific Indian city tiers. With **Google Maps Grounding**, it identifies actual local markets based on your real-time geolocation.

### 👁️ Vision Node (Cargo Scanning)
Don't type your inventory. Use your device's camera to "Scan Cargo." Powered by `gemini-3-flash-preview`, the node identifies ingredients from a pantry photo and adds them to your tactical intel.

### 🎙️ Audio Briefing
Every blueprint comes with a personalized tactical briefing. Using `gemini-2.5-flash-preview-tts`, the "Boss" narrates your daily strategy, highlighting budget wins and mission goals.

### 🖼️ Visual Blueprints
Visualize your success. Use `imagen-4.0-generate-001` to generate cinematic, professional-grade food photography of your specific meal plan targets.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **LLM Core** | `gemini-2.5-flash` (Grounding & Logic) |
| **Vision** | `gemini-3-flash-preview` (Optical Analysis) |
| **Audio** | `gemini-2.5-flash-preview-tts` (Real-time TTS) |
| **Imagery** | `imagen-4.0-generate-001` (Neural Visualization) |

---

## 🚀 Quick Start

### 1. Clone the Mission Repository
```bash
git clone https://github.com/your-username/mafia-food.git
cd mafia-food
```

### 2. Environment Setup
Create a `.env` file in the root directory and add your Google AI Studio API Key:
```env
API_KEY=your_gemini_api_key_here
```

### 3. Installation
This project uses ES6 modules directly in the browser via `esm.sh`. No heavy `npm install` is required for the frontend itself, but ensure you are serving the files via a local server.

If using a standard development environment:
```bash
npm install
npm run dev
```

---

## 🎮 Operational Guide

1.  **Set Your Sector**: Choose your city type (Metro, Tier-2, or Tier-3) to calibrate price intel.
2.  **Scan Cargo**: Use the Camera icon to identify what you already have in stock.
3.  **Choose Mission Mode**:
    *   **Standard**: Balanced operation.
    *   **One-Pot**: Minimal cleanup, maximum stealth.
    *   **Portable**: Meals engineered for transit.
    *   **Low-Effort**: High-impact nutrition for exhausted operatives.
4.  **Execute Blueprint**: Architect your multi-day strategy.
5.  **Hit List**: Use the generated grocery checklist to acquire missing assets at the best rates.

---

## 📂 Project Structure

```text
├── App.tsx             # Main Operation Center (UI & State)
├── index.tsx           # Entry Point
├── index.html          # Global Styles & Fonts
├── types.ts            # Data Schemas & Tactical Definitions
├── metadata.json       # App Permissions (Camera, Geolocation)
└── services/
    └── geminiService.ts # AI Service Layer (Vision, TTS, Grounding)
```

---

## 🔒 Security & Privacy

*   **Local Storage**: Your preferences and pantry intel stay on your machine.
*   **Permissions**: The app requests `camera` and `geolocation` solely for ingredient scanning and market mapping.
*   **API Security**: Ensure your `API_KEY` is never committed to public version control.

---

## 🤝 Credits & Reference

This application was built as a showcase of the **Google Gemini API** capabilities, specifically focusing on:
*   Multi-modal inputs (Image + Text).
*   Search and Maps Tool Grounding.
*   Dynamic real-time audio generation.

**MAFIA FOOD • PRECISION MEAL ENGINEERING • GROUND-ZERO OPS**
