import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import urlparse
from app.config import settings
import logging

logger = logging.getLogger(__name__)

def check_and_create_db():
    """Checks if the target database exists and creates it if it doesn't."""
    # Parse the target database name
    parsed_url = urlparse(settings.DATABASE_URL)
    db_name = parsed_url.path.lstrip("/")
    
    # Parse master connection details
    master_url = settings.DATABASE_URL_MASTER
    parsed_master = urlparse(master_url)
    
    try:
        # Connect to master postgres database to check/create target database
        conn = psycopg2.connect(
            dbname="postgres",
            user=parsed_master.username,
            password=parsed_master.password,
            host=parsed_master.hostname,
            port=parsed_master.port or 5432
        )
        conn.autocommit = True
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s", (db_name,))
        exists = cursor.fetchone()
        
        if not exists:
            logger.info(f"Database '{db_name}' does not exist. Creating...")
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            logger.info(f"Database '{db_name}' created successfully.")
        else:
            logger.info(f"Database '{db_name}' already exists.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error checking/creating database: {e}")
        # Note: If it fails (e.g. permission issues or already exists and connected), we still try to proceed

# Run the DB check/create
check_and_create_db()

# Create target SQLAlchemy connection engine
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to retrieve database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
