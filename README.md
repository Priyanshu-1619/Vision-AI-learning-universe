# 🌌 AI Learning Universe

> **An interactive, visually rich, and mathematically rigorous educational platform for Data Science, Machine Learning, and Deep Learning.**

AI Learning Universe is a full-stack educational environment designed to help learners understand, explore, and experiment with machine learning and deep learning algorithms from the ground up.

---

## ⚡ Core Principles & Technical Architecture

1. **Zero External AI API Dependencies**: The application requires **NO API keys** (no OpenAI, Gemini, Claude, Groq, or OpenRouter). All ML algorithms, gradients, regression fits, and clustering iterations run **100% locally** through our own Python backend using NumPy, pandas, and scikit-learn.
2. **Safe Mathematical Expression Engine**: Custom recursive descent tokenizer and AST evaluator that parses user-entered mathematical expressions and generates curves in real-time without ever calling `eval()` or executing arbitrary user JavaScript.
3. **Bilingual Concept Explanations**: High-yield mathematical graph notes available in both **Simple English** and natural **Hinglish** (Hindi in Roman script) for contextual terminology understanding.
4. **Independent Domain Separation**: Dedicated learning environments for **Data Science**, **Machine Learning**, and **Deep Learning**, each structured across **Basic**, **Intermediate**, and **Advanced** tiers.
5. **Deep Space Aesthetic**: Dark space theme featuring deep space navy (`#050814`, `#0B1633`), electric cobalt blue (`#164BFF`), canary yellow highlights (`#FACC15`), and icy cyan accents (`#06B6D4`).

---

## 🚀 Key Modules & Application Routes

| Route | Feature | Description |
|---|---|---|
| `/` | **Master Dashboard** | Domain overview cards for Data Science, ML, and Deep Learning with independent progress tracking. |
| `/concept-universe` | **AI Concept Universe** | Cosmic 2D constellation of **316 nodes** and **682 edges** across 8 clusters with real-time D3 physics, domain/level filters, and a custom **Spaceship Exploration Probe Cursor** with plasma exhaust trail. |
| `/laboratory` | **AI Laboratory** | Proving ground running live scikit-learn algorithms (Linear Regression OLS, K-Means, K-Nearest Neighbors, Decision Trees, and PCA) with custom dataset generators. |
| `/inside-model` | **Inside the Model** | Step-by-step visual inspectors including a **10-Stage Backpropagation Stepper** with interactive synaptic weights/biases editing, Single Neuron inspector, and Activation Function explorer. |
| `/library-graph` | **Library Graph Lab** | Interactive mathematical laboratory allowing users to plot custom mathematical functions simultaneously, inspect coordinate crosshairs, adjust parameter sliders, and view bilingual graph notes. |
| `/roadmaps/:domain` | **Interactive Roadmaps** | Tiered learning roadmaps (Basic, Intermediate, Advanced) for Data Science, Machine Learning, and Deep Learning with mathematical prerequisite mapping. |
| `/dictionary` | **AI Dictionary** | Searchable glossary of foundational AI, ML, and mathematical terminology. |
| `/missions` | **AI Mission Mode** | Scenario-based problem-solving challenges with algorithmic checkpoints. |

---

## 🛠️ System Prerequisites

Ensure you have the following installed on your machine:

- **Python**: Version `3.10` or higher (`3.11`+ recommended)
- **Node.js**: Version `18.0.0` or higher (`v20`+ recommended)
- **npm**: Version `9.0.0` or higher
- **OS**: Windows, macOS, or Linux

---

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-learning-universe.git
cd "ai lab"
```

---

### 2. Backend Setup (FastAPI + Python ML)

Navigate to the project root and create a virtual environment:

#### Windows (PowerShell):
```powershell
# Create virtual environment
python -m venv backend\venv

# Activate virtual environment
.\backend\venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r backend\requirements.txt
```

#### macOS / Linux / Git Bash:
```bash
# Create virtual environment
python3 -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/activate

# Install required dependencies
pip install -r backend/requirements.txt
```

---

### 3. Frontend Setup (React 19 + Vite)

In a separate terminal, install the frontend dependencies:

```bash
cd frontend
npm install
```

---

## 🖥️ Running the Application

### Start the Backend API Server

Run the FastAPI backend on port `8000`:

#### Windows (PowerShell):
```powershell
& .\backend\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload
```

#### macOS / Linux (from repo root):
```bash
backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir backend --reload
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`
- **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

### Start the Frontend Dev Server

In your frontend terminal:

```bash
cd frontend
npm run dev
```

- **Frontend Application**: `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173` to explore the AI Learning Universe!

---

## 💻 Running ML Models via Command Line (CLI)

You can run and inspect the scikit-learn models directly from your terminal using our dedicated CLI tool without opening a browser:

```bash
# General syntax
python backend/run_lab_cli.py --model <MODEL_NAME> [OPTIONS]
```

### 1. Linear Regression (Ordinary Least Squares + Gradient Descent Trace)
Fits an optimal hyperplane $y = mx + b$, outputs slope, intercept, and MSE loss:
```powershell
# Windows
& .\backend\venv\Scripts\python.exe backend/run_lab_cli.py --model linear-regression --dataset linear

# Linux / macOS
python backend/run_lab_cli.py --model linear-regression --dataset outliers
```

### 2. K-Means Clustering
Partitions 2-D coordinates into $K$ Voronoi clusters using `k-means++` initialization:
```powershell
# Windows
& .\backend\venv\Scripts\python.exe backend/run_lab_cli.py --model kmeans --k 3 --dataset blobs

# Linux / macOS
python backend/run_lab_cli.py --model kmeans --k 4 --dataset circles
```

### 3. K-Nearest Neighbors (KNN)
Predicts class probabilities for an arbitrary query coordinate based on the $K$ closest neighbors:
```powershell
# Windows
& .\backend\venv\Scripts\python.exe backend/run_lab_cli.py --model knn --k 5 --dataset moons

# Linux / macOS
python backend/run_lab_cli.py --model knn --k 7 --dataset iris
```

### 4. Decision Tree Classifier
Calculates Gini impurity and Information Gain across feature splits:
```powershell
# Windows
& .\backend\venv\Scripts\python.exe backend/run_lab_cli.py --model decision-tree --max-depth 3 --dataset moons

# Linux / macOS
python backend/run_lab_cli.py --model decision-tree --max-depth 4 --dataset circles
```

### 5. Principal Component Analysis (PCA)
Performs Singular Value Decomposition (SVD), extracts eigenvectors, and calculates explained variance ratio:
```powershell
# Windows
& .\backend\venv\Scripts\python.exe backend/run_lab_cli.py --model pca --standardize --dataset correlated

# Linux / macOS
python backend/run_lab_cli.py --model pca --dataset blobs
```

---

## 🌐 Running ML Models via REST API (cURL / PowerShell)

You can also trigger local ML model computations directly over the REST API:

### Linear Regression API
```bash
curl -X POST "http://127.0.0.1:8000/api/labs/linear-regression" \
     -H "Content-Type: application/json" \
     -d '{"data": {"x": [1, 2, 3, 4, 5], "y": [2.1, 4.0, 6.1, 8.0, 9.9]}, "params": {"learning_rate": 0.05, "epochs": 20}}'
```

### K-Means Clustering API
```bash
curl -X POST "http://127.0.0.1:8000/api/labs/kmeans" \
     -H "Content-Type: application/json" \
     -d '{"data": [[1, 2], [1, 4], [1, 0], [10, 2], [10, 4], [10, 0]], "k": 2, "init_method": "k-means++", "seed": 42, "max_iter": 10}'
```

---

## 🧪 Testing & Code Quality

### Frontend Linting
Run the fast Rust-based `oxlint` linter across all frontend components:
```bash
cd frontend
npm run lint
```

### Frontend Production Build
Verify that the production build compiles cleanly:
```bash
cd frontend
npm run build
```

### Preview Production Build
Preview the minified production distribution locally:
```bash
cd frontend
npm run preview
```

---

## 📁 Project Directory Structure

```text
ai-learning-universe/
├── backend/
│   ├── data/
│   │   ├── concepts.json        # 316 validated concepts (DS, ML, DL, Math)
│   │   ├── roadmaps.json        # Domain roadmaps (Basic, Intermediate, Advanced)
│   │   └── mathematics.json     # Canonical mathematics curriculum
│   ├── models/                  # Pydantic data schemas
│   │   └── concept.py           # Concept, GraphNode, and Lab computation schemas
│   ├── routers/                 # FastAPI REST endpoints
│   │   ├── concepts.py          # /api/concepts, /api/concepts/graph
│   │   ├── labs.py              # /api/labs (linear-regression, kmeans, knn, dt, pca)
│   │   ├── roadmaps.py          # /api/roadmaps
│   │   └── health.py            # /api/health
│   ├── services/                # Scikit-learn & scientific compute algorithms
│   │   ├── lab_datasets.py      # Synthetic dataset generators
│   │   ├── regression_service.py # OLS & Gradient Descent solver
│   │   ├── kmeans_service.py    # Iterative K-Means clustering
│   │   ├── knn_service.py       # Nearest neighbors decision boundary
│   │   ├── decision_tree_service.py # Split tree generator
│   │   └── pca_service.py       # SVD & Eigen decomposition
│   ├── run_lab_cli.py           # Command-line model runner
│   ├── main.py                  # FastAPI application entrypoint
│   └── requirements.txt         # Backend Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── knowledge/       # Concept Universe & Spaceship Cursor
│   │   │   │   ├── ConceptUniverse.jsx
│   │   │   │   └── SpaceshipCursor.jsx
│   │   │   ├── laboratory/      # Phase 3 AI Algorithm Laboratories
│   │   │   │   ├── LinearRegressionLab.jsx
│   │   │   │   ├── KMeansLab.jsx
│   │   │   │   ├── KNNLab.jsx
│   │   │   │   ├── DecisionTreeLab.jsx
│   │   │   │   └── PCALab.jsx
│   │   │   ├── inside-model/    # Phase 5 Neural Network & Backprop Stepper
│   │   │   │   └── BackpropStepper.jsx
│   │   │   ├── mathematics/     # Library Graph mathematical laboratory
│   │   │   │   └── LibraryGraph.jsx
│   │   │   └── visualization/   # Unified Visualization Engine & Modals
│   │   │       ├── EquationCustomizerModal.jsx
│   │   │       ├── GraphNotesModal.jsx
│   │   │       └── VisualizationEngine.jsx
│   │   ├── utils/
│   │   │   ├── safeMathParser.js # Recursive descent math expression compiler
│   │   │   ├── graphNotesData.js # Bilingual (English/Hinglish) graph notes
│   │   │   └── neuralEngine.js   # 10-stage backpropagation calculus engine
│   │   ├── pages/               # React route pages
│   │   └── App.jsx              # Router configuration
│   ├── package.json             # Frontend npm dependencies
│   └── vite.config.js           # Vite build configuration
│
├── requirements.txt             # Master repository Python requirements
└── README.md                    # Project documentation & run guide
```

---

## 📜 License

This project is developed for educational and experimental purposes. Free to use, study, and modify.

