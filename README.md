# CareSync

## Real-Time Surplus Food Redistribution Platform

CareSync is a real-time micro-logistics platform designed to connect surplus food providers with people, volunteers, and distribution teams who can claim and coordinate the collection of available food resources.

> **Reduce food waste by making surplus food easier to discover, claim, and redistribute in real time.**

Built as a hackathon MVP, CareSync combines location-based discovery, user authentication, real-time database updates, and a simple claiming workflow into one accessible platform.

---

## 🚀 Live Demo

**Live Application:**  
https://pankaj0621.github.io/caresync/

**GitHub Repository:**  
https://github.com/pankaj0621/caresync

---

## 🎯 Problem Statement

Large amounts of usable food can become surplus after events, restaurants, cafeterias, households, and other food-related activities.

At the same time, people and community organizations may need access to food resources. The challenge is often coordination: finding available food quickly, knowing where it is located, preventing duplicate claims, and connecting the provider with the person collecting it.

CareSync addresses these challenges through a real-time, location-based platform.

---

## 💡 Our Solution

CareSync provides a shared live map where users can publish surplus food and discover available resources nearby.

```text
Food Provider
     ↓
Publish Surplus Food
     ↓
Location Added
     ↓
Resource Appears on Live Map
     ↓
Claimer Finds Food
     ↓
Claim Resource
     ↓
Provider ↔ Claimer Coordination
```

Once a resource is claimed, its availability is updated so other users cannot claim the same resource.

---

## ✨ Key Features

### 🍱 Surplus Food Publishing
Users can publish available food with food type, quantity, pickup location, and relevant profile information.

### 🗺️ Real-Time Interactive Map
Available food resources are displayed on an interactive map using Leaflet, React Leaflet, and OpenStreetMap.

### 📍 Location Detection
The browser Geolocation API helps users capture their current location and use it for map discovery and pickup coordinates.

### 👤 Authentication & Profiles
Users can register and sign in through Supabase Authentication. Profiles associate users with resources they publish or claim.

### 🎯 Resource Claiming
Users can claim available food resources directly from the map. The claiming workflow prevents the same resource from being claimed by multiple users.

### 🚫 Self-Claim Protection
A user cannot claim a food resource that they personally published.

### ⚡ Real-Time Updates
Supabase Realtime keeps donation availability synchronized across active clients.

```text
User A publishes food
        ↓
Supabase Database
        ↓
Realtime Event
        ↓
User B sees the new resource
```

When a resource is claimed:

```text
Available
    ↓
Claimed
    ↓
Removed from available resources
```

### 🤝 Provider & Claimer Coordination
After a successful claim, the platform is designed to connect the provider and claimer with the information needed to coordinate pickup.

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      CareSync        │
                    │    React Frontend    │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Supabase Auth   PostgreSQL      Realtime
                │              │              │
                ▼              ▼              ▼
             Profiles       Donations     Live Updates
                               │
                               ▼
                         Claim Workflow
                               │
                               ▼
                    Provider ↔ Claimer
```

---

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- Tailwind CSS
- shadcn/ui
- Lucide React

### Backend & Database
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Realtime

### Mapping
- Leaflet
- React Leaflet
- OpenStreetMap

### Validation & Development
- Zod
- Git
- GitHub
- GitHub Actions
- GitHub Pages
- VS Code

---

## 📁 Project Structure

```text
caresync/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── public/
├── src/
│   ├── components/
│   │   └── ui/
│   ├── features/
│   │   └── donations/
│   │       ├── DonationForm.jsx
│   │       ├── DonationMap.jsx
│   │       └── donationSchema.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   └── useDonations.js
│   ├── lib/
│   │   ├── supabaseClient.js
│   │   └── utils.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/pankaj0621/caresync.git
```

### 2. Enter the project directory

```bash
cd caresync
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not commit `.env` to the repository.

### 5. Start the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

### 6. Build for production

```bash
npm run build
```

### 7. Preview the production build

```bash
npm run preview
```

---

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anonymous/publishable key |

**Security:** Never expose or commit a Supabase service-role key to the frontend or GitHub repository.

---

## 🗄️ Data Model

CareSync uses Supabase PostgreSQL for application data.

### Donations

Core donation information includes:

```text
id
food_type
quantity
lat
lng
status
created_at
```

User profile and claim information supports the publishing and claiming workflow.

---

## 🔄 Resource Lifecycle

```text
┌─────────────┐
│  Available  │
└──────┬──────┘
       │
       │ Claim
       ▼
┌─────────────┐
│   Claimed   │
└──────┬──────┘
       │
       │ Pickup
       ▼
┌─────────────┐
│  Completed  │
└─────────────┘
```

---

## 🌍 Deployment

CareSync is deployed using GitHub Pages with GitHub Actions.

```text
Developer
    ↓
GitHub Repository
    ↓
GitHub Actions
    ↓
Vite Production Build
    ↓
GitHub Pages
    ↓
Live CareSync Application
```

**Production URL:**  
https://pankaj0621.github.io/caresync/

---

## 🏆 Hackathon MVP

CareSync was developed as a hackathon MVP focused on demonstrating a practical real-time food redistribution workflow.

### Implemented

- [x] User registration
- [x] User authentication
- [x] User profiles
- [x] Surplus food publishing
- [x] Location-based food discovery
- [x] Interactive map
- [x] Real-time donation updates
- [x] Resource claiming
- [x] Self-claim prevention
- [x] Provider/claimer coordination
- [x] Supabase integration
- [x] GitHub Pages deployment

---

## 🔮 Future Roadmap

- **Smart Nearby Matching** — Recommend the closest available resources based on user location.
- **Notifications** — Notify users about claims, new nearby food, and pickup deadlines.
- **In-App Communication** — Enable secure communication between providers and claimers.
- **Food Images** — Allow providers to upload images of available food.
- **Automatic Expiry** — Automatically expire resources after a defined period.
- **Impact Dashboard** — Track resources redistributed, successful claims, active users, and estimated meals rescued.
- **Organization Accounts** — Support NGOs, restaurants, hotels, cafeterias, event organizers, and community groups.

---

## 👥 Team CareSync

CareSync was developed collaboratively as a hackathon project by a multidisciplinary student team.

| Team Member | Role & Contribution |
|---|---|
| **Nandlal Mahato** | **Project Management** — Project coordination, planning, task management, and overall team execution |
| **Pankaj Kumar** | **Frontend Developer** — React frontend, UI implementation, interactive map integration, user experience, and frontend deployment |
| **Nitesh Kumar Mandal** | **Backend Developer** — Supabase integration, database architecture, authentication, real-time functionality, and backend workflows |

### 🤝 Team Collaboration

The team worked together across planning, development, testing, and presentation to build a functional MVP within the hackathon timeline.

---

## 🌱 Social Impact

CareSync is built around a simple idea:

```text
Surplus Food
     +
Real-Time Information
     +
Location
     +
Community Coordination
     ↓
More Efficient Food Redistribution
     ↓
Less Food Waste
```

By reducing the coordination gap between surplus food providers and people who can use or redistribute that food, CareSync aims to turn unused resources into meaningful community impact.

---

## 📄 License

This project was created as a hackathon MVP.

If the project is later open-sourced for public contribution, an appropriate open-source license can be added.

---

## 🙏 Acknowledgements

CareSync uses open-source technologies and services including:

- React
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- Leaflet
- OpenStreetMap
- Lucide React
- Zod

---

## 🔗 Project Links

**Live Application:**  
https://pankaj0621.github.io/caresync/

**Source Code:**  
https://github.com/pankaj0621/caresync

---

### Built with ❤️ by Team CareSync
### Turning surplus food into meaningful impact.
