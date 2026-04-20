# Backend Setup

## Avtivate venv

```bash
python -m venv .venv
.venv\Scripts\activate  # Windowsの場合
source .venv/bin/activate  # Mac/Linuxの場合
```

## Install Dependencies

To install the required dependencies, run the following command:

```bash
pip install -r requirements.txt
```

## Run Application

To start the application with `uvicorn`, use the following command:

```bash
uvicorn main:app --reload --port 8000 --host 0.0.0.0
```
