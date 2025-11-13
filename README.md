
## 🚀 Step-by-Step Guide to Run the Backend

This guide assumes you are starting from the root of your project directory (`C:\revenue-pulse-15-main\backend`).

-----

### Step 1: Clone the Repository and Navigate

First, ensure you are inside the correct project directory where your `server.py` and `.venv` are located.

```powershell
# If you are outside the backend directory, navigate into it:
PS C:\revenue-pulse-15-main> cd backend
# Now you should be here:
PS C:\revenue-pulse-15-main\backend>
```

-----

### Step 2: Activate the Virtual Environment

You must always work inside your virtual environment (`.venv`) to ensure you use the project's specific dependencies.

```powershell
# Activate the virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

You should see `(.venv)` prefixing your prompt, indicating the environment is active: `(.venv) PS C:\revenue-pulse-15-main\backend>`

-----

### Step 3: Install Dependencies (If needed)

Although you have run these before, it's a critical step for any new setup. Ensure all required packages are installed.

```powershell
# Install all required packages from a requirements.txt (if you have one)
(.venv) PS C:\revenue-pulse-15-main\backend> pip install -r requirements.txt 

# If you don't have a requirements.txt, ensure key packages are installed:
(.venv) PS C:\revenue-pulse-15-main\backend> pip install uvicorn fastapi python-dotenv motor google-genai
```

-----

### Step 4: Configure Environment Variables (`.env`)

The application needs two critical secrets to run. You must create a file named **`.env`** in the `C:\revenue-pulse-15-main\backend` directory and add the following two variables, substituting the placeholders with your actual secrets.

> **Crucial Note:** Your MongoDB password must be **URL-escaped** (e.g., `#` becomes `%23`).

| Variable | Description |
| :--- | :--- |
| `MONGO_URL` | Your MongoDB Atlas connection string (must be escaped). |
| `GEMINI_API_KEY` | Your API key obtained from Google AI Studio. |

```ini
# .env file content
MONGO_URL="mongodb://<user>:<password_escaped>@<host>/<database>?<options>"
GEMINI_API_KEY="AIzaSy...your-actual-key-here"
```

-----

### Step 5: Run the Server

Execute the Uvicorn command to start the application in **development mode** (`--reload` enables automatic restart on code changes).

```powershell
(.venv) PS C:\revenue-pulse-15-main\backend> uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

-----

### Step 6: Verify and Access the API

If the server starts successfully, you will see the message: `INFO: Application startup complete.`.

1.  **Check Status:** The server will be listening at `http://0.0.0.0:8000`.

2.  **Access Docs:** Open your web browser and navigate to the FastAPI auto-generated documentation to view and test your endpoints:

    `http://127.0.0.1:8000/docs` or `http://localhost:8000/docs`

You can now interact with your backend\!