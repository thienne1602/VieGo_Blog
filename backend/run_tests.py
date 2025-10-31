import unittest
import sys
import os

# Ensure backend package path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

loader = unittest.TestLoader()
start_dir = os.path.join(os.path.dirname(__file__), 'tests')

suite = loader.discover(start_dir)

runner = unittest.TextTestRunner(verbosity=2)
result = runner.run(suite)

if not result.wasSuccessful():
    sys.exit(1)
