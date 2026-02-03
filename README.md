# Homelab Network Designer

A premium, interactive web application for planning and visualizing network infrastructure. Built with a focus on aesthetics and professional features.

![Homelab Network Designer](https://via.placeholder.com/800x400?text=Homelab+Network+Designer+UI)

## 🚀 Features

- **Interactive Editor**: Drag-and-drop infrastructure components with real-time connectivity.
- **WIB Clock**: Integrated real-time Western Indonesian Time (WIB) display.
- **Undo/Redo System**: Full history support for all design actions.
- **Advanced Node Types**:
  - **Servers**: Monitor hosted applications and resource details.
  - **Network Devices**: Manage VLANs and logical segmentation.
- **Dynamic Connections**: Multiple line styles (Bezier, Smooth Step) and animations (Dashed, Dots).
- **Project Dashboard**: Manage multiple infrastructure projects with ease.
- **Premium UI**: Modern glassmorphism design with Outfit typography.

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Diagrams**: React Flow (@xyflow/react)
- **State Management**: Zustand (Persist + Undo/Redo history)
- **Styling**: Vanilla CSS with a custom design system
- **Icons**: Lucide React

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd "Homelab network"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 🐳 Deployment with Docker

The application is container-ready and includes a pre-configured Docker setup.

### Using Docker Compose

```bash
docker compose up -d --build
```

The application will be available at `http://localhost:3300`.

## 📄 License

Internal Project / All Rights Reserved.

---
*Developed for advanced infrastructure management.*
