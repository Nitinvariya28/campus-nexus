import multiprocessing
import os

# Gunicorn configuration file for Render Cloud deployment
# Enables concurrent multi-threaded request processing to prevent queuing bottlenecks

# 2 workers with 4 threads each = 8 concurrent request handlers
workers = 2
threads = 4
worker_class = "gthread"

# Timeout settings (prevents slow LLM or cross-region network requests from aborting prematurely)
timeout = 60
keepalive = 5

# Memory management: restart workers periodically to prevent memory leaks in free tiers
max_requests = 1000
max_requests_jitter = 50

# Log formats
loglevel = "info"
accesslog = "-"
errorlog = "-"
