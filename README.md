# 🎓 Studify

**Transform your study materials into intelligent learning paths.**

Studify is an AI-powered educational platform designed to help students
streamline their learning process. By analyzing presentation decks and
documents, Studify provides deep insights, automated study plans, and
interactive quizzes to maximize academic performance.

------------------------------------------------------------------------

## ✨ Features

-   📊 **Intelligent Dashboard**\
    Real-time overview of your study progress, subject coverage, and
    recent uploads.

-   👥 **Role-Based Access (Student & Teacher)**\
    Tailored views and functionalities for both educators managing courses
    and students organizing their learning resources.

-   🧬 **AI Material Analysis**\
    Upload `.pptx` and `.pdf` files for automatic analysis. Powered by **Gemini
    AI**, Studify extracts key topics, estimates study time, and
    provides personalized study tips. 

-   💾 **Cloud Storage & Data Persistence**\
    Features reliable file downloads & storage backed by **Supabase**, 
    while AI logs and fast-access metrics are maintained in **MongoDB**.

-   📅 **Dynamic Study Planner**\
    Generate a personalized study schedule based on your available
    hours, learning speed, and exam dates. Includes fast background processing.

-   🗓️ **Interactive Calendar**\
    View your study sessions in a monthly or weekly grid, export to
    `.ics` for external use.

-   🧠 **AI Quiz Generation**\
    Automatically create quizzes from your study materials to test your
    knowledge.

-   ⚙️ **Dynamic Profiles & Subject Management**\
    Organize your materials by subject with custom colors and
    edit your user profile dynamically.

------------------------------------------------------------------------

## 🛠️ Technology Stack

### Frontend

-   **Framework**: React + Vite\
-   **Language**: TypeScript\
-   **Styling**: Tailwind CSS + Radix UI\
-   **Icons**: Lucide React\
-   **Charts**: Recharts

### Backend

-   **Framework**: FastAPI\
-   **Database**: PostgreSQL (SQLAlchemy) + MongoDB (Motor) + Supabase\
-   **AI Integration**: Google GenAI\
-   **File Parsing**: python-pptx, PyMuPDF

------------------------------------------------------------------------

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18+)
-   Python (v3.10+)
-   Gemini API Key

------------------------------------------------------------------------

### Installation & Run

1.  **Install Dependencies**

    ``` bash
    npm run install:all
    ```

2.  **Configure Environment**

    Create a `.env` file in the `backend/` directory:

    ``` env
    GEMINI_API_KEY=your_api_key_here
    ```

3.  **Launch the Application**

    ``` bash
    npm run dev
    ```

------------------------------------------------------------------------

## 🏛️ Project Structure

``` text
├── backend/
│   ├── models/
│   ├── routers/
│   ├── services/
│   └── data/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   └── services/
├── dev.sh
└── README.md
```

------------------------------------------------------------------------

## 👨‍💻 Development

-   **Frontend**: http://localhost:5173\
-   **Backend**: http://localhost:8000\
-   **API Docs**: http://localhost:8000/docs
