@echo off
REM Batch script to create admin user in Docker container
docker-compose exec backend python create_admin.py
