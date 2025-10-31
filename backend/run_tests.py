import unittest
import sys
import os

# Ensure both the backend directory and the repository root are on sys.path so tests
# can import either `main` (module) or `backend.main` (package).
backend_dir = os.path.abspath(os.path.dirname(__file__))
repo_root = os.path.abspath(os.path.join(backend_dir, '..'))
# Insert repo_root first so `import backend.main` works, then backend_dir so `import main` works
sys.path.insert(0, repo_root)
sys.path.insert(0, backend_dir)

loader = unittest.TestLoader()
start_dir = os.path.join(os.path.dirname(__file__), 'tests')

suite = loader.discover(start_dir)

runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)

if not result.wasSuccessful():
    sys.exit(1)
