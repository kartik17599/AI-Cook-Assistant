# 🐼 Mafia Food: Tactical Meal Engineering

> **"Listen kid, I don't care if you're in a Tier-3 village or a Metro high-rise. Mafia Food ensures you're fed tactical, flavor-packed meals without blowing your budget. Lock in the mission intel and let's cook."**

Mafia Food is a high-stakes meal planning "Command Center" designed for users navigating strict budgets and limited resources. It transforms mundane grocery shopping and cooking into a high-precision tactical operation using the latest in Google Generative AI.

---

## 🎯 The Mission
Most meal planners assume you have an unlimited budget and a fully stocked supermarket next door. **Mafia Food** assumes the opposite. It is engineered to:
- **Save Capital**: Verify real-world prices using Google Search.
- **Optimize Cargo**: Scan your existing pantry using Gemini Vision.
- **Navigate Sectors**: Find supply nodes via Google Maps.
- **Execute Precision**: Provide minute-by-minute cooking sequences.

---

## ⚡ Tactical Features (Google Services Integration)

### 🛰️ Multi-Modal Grounding (Search & Maps)
The app doesn't guess; it verifies. By utilizing **Google Search Grounding**, it fetches real-time market rates for ingredients in specific Indian city tiers (Metro, Tier-2, Tier-3). With **Google Maps Grounding**, it identifies actual supply nodes (shops/markets) based on your geolocation.

### 👁️ Tactical Vision Node
Use your device's camera to "Scan Cargo." Powered by `gemini-3-flash-preview`, the app identifies ingredients from a photo of your pantry or fridge and automatically adds them to your tactical intel.

### 🎙️ Audio Mission Briefings
Every blueprint comes with a personalized tactical briefing. Using `gemini-2.5-flash-preview-tts` (Text-to-Speech), the "Boss" narrates your daily strategy, highlighting budget wins and protein optimizations.

### 🖼️ Visual Blueprints
Visualize your success before you light the stove. Use `imagen-4.0-generate-001` to generate professional-grade food photography of your specific meal plan, ensuring your "targets" look exactly as intended.

---

## 🛠️ The Tech Stack

- **Framework**: React 19 (ES6 Modules)
- **Styling**: Tailwind CSS (Custom "Mafia" Palette)
- **Intelligence**: 
  - `gemini-2.5-flash`: Core logic & Location-aware grounding.
  - `gemini-3-flash-preview`: High-speed vision & pantry analysis.
  - `gemini-2.5-flash-preview-tts`: Tactical audio narration.
  - `imagen-4.0-generate-001`: High-fidelity meal visualization.

---

## 🎮 Operational Guide

1.  **Set Your Sector**: Choose your city type (Metro/Tier-2/Tier-3) to calibrate price intel.
2.  **Scan Cargo**: Use the Camera icon to identify what you already have.
3.  **Choose Mission Mode**:
    *   **Standard**: Balanced operation.
    *   **One-Pot**: Minimal cleanup, maximum stealth.
    *   **Portable**: Meals meant for transit.
    *   **Low-Effort**: When the Boss is tired.
4.  **Execute**: Click **Execute Blueprint** to generate your multi-day strategy.
5.  **Listen & View**: Play the audio briefing and generate meal visuals to complete the op.

---

## 🔒 Security & Privacy
- **Local Intel**: User preferences are stored in your browser's `localStorage`.
- **Permissions**: Requires Camera (for pantry scanning) and Geolocation (for mapping supply nodes).

---

## 🤝 Reference
This application was built as a showcase of **Google Gemini API** capabilities, specifically focusing on multi-modal inputs, grounding tools, and real-time audio generation.

**MAFIA FOOD • PRECISION MEAL ENGINEERING • GROUND-ZERO OPS**
