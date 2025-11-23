# Revenue Analytics System

This is a full-stack web application designed to provide real-time insights into revenue performance. It features a React frontend for data visualization and a FastAPI backend for data processing, analytics, and serving a RESTful API.

## Features

- **CSV/Excel Import:** Easily upload and process transaction data.
- **Dashboard Overview:** Get a quick summary of key performance indicators (KPIs), including an AI-generated narrative.
- **Product Performance:** Visualize top-performing products with an interactive bar chart.
- **Revenue Timeline:** Track daily revenue trends over time with a line chart.
- **Anomaly Detection:** Automatically identify unusual spikes or drops in revenue.
- **Data Export:** Export transaction data to CSV and generate PDF reports.
- **Responsive UI:** A clean, modern interface built with Tailwind CSS and Radix UI.

## Technology Stack

- **Frontend:**
  - React 18, TypeScript, Vite
  - TanStack React Query v5 (for data fetching & caching)
  - Recharts (for data visualization)
  - Tailwind CSS & Radix UI (for styling)
  - `jspdf` & `html2canvas` (for PDF export)
- **Backend:**
  - FastAPI (Python web framework)
  - Motor (Asynchronous MongoDB driver)
  - Pandas & NumPy (for data analytics)
  - Uvicorn (ASGI server)
- **Database:**
  - MongoDB Atlas

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Node.js:** Version 18.x or later. [Download here](https://nodejs.org/)
- **Python:** Version 3.10 or later. [Download here](https://www.python.org/)
- **MongoDB Atlas Account:** You will need a free MongoDB Atlas account and a connection string. [Sign up here](https://www.mongodb.com/cloud/atlas/register)

---

### Setup Instructions

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd revenue-pulse-15-main
    ```

2.  **Backend Setup:**

    - **Navigate to the backend directory:**
      ```bash
      cd backend
      ```
    - **Create a `.env` file:** Create a new file named `.env` in the `backend` directory and add the following content. Replace the placeholder with your actual MongoDB Atlas connection string.

      ```dotenv
      # backend/.env
      MONGO_URL="mongodb+srv://<user>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority"
      DB_NAME="revenue_hub"
      CORS_ORIGINS="*" 
      ```
    - **Create and activate a Python virtual environment:**
      ```bash
      # For Windows
      python -m venv .venv
      .\.venv\Scripts\activate

      # For macOS/Linux
      python3 -m venv .venv
      source .venv/bin/activate
      ```
    - **Install Python dependencies:**
      ```bash
      pip install -r requirements.txt
      ```

3.  **Frontend Setup:**

    - **Navigate to the frontend directory:**
      ```bash
      # From the project root
      cd frontend
      ```
    - **Install Node.js dependencies:**
      ```bash
      npm install
      ```
    - **Install PDF generation libraries:**
      ```bash
      npm install jspdf html2canvas
      ```

---

### Running the Application

You will need to run the backend and frontend servers in two separate terminals.

1.  **Start the Backend Server:**
    - Open a terminal and navigate to the `backend` directory.
    - Make sure your virtual environment is activated.
    - Run the following command:
      ```bash
      uvicorn server:app --reload
      ```
    - The backend API will be running at `http://localhost:8000`.

2.  **Start the Frontend Development Server:**
    - Open a **second** terminal and navigate to the `frontend` directory.
    - Run the following command:
      ```bash
      npm run dev
      ```
    - The frontend application will be running at `http://localhost:5173`.

### Usage

1.  Open your web browser and navigate to `http://localhost:5173`.
2.  On the **Overview** page, use the **"Import CSV"** button to upload your transaction data.
3.  Navigate through the **Timeline**, **Products**, and **Anomalies** pages to see the visualized analytics.
4.  Use the **"Export PDF Report"** button on the Overview page to generate a PDF summary.