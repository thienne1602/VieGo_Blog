Running backend tests

Prerequisites:

- Python 3.10+ (same interpreter used by the project)
- Install test requirements: pip install pytest

Run tests locally (PowerShell example):

Set-Location -LiteralPath 'D:\path\to\project\backend'
python run_tests.py

Or using pytest (if installed):

pytest -q

CI: a GitHub Actions workflow is included at `.github/workflows/backend-tests.yml` which will run the tests on push/PR to `main`.

The tests use an in-memory SQLite database to avoid touching your MySQL dev DB.
