import duckdb
import os
import tempfile
import atexit
import time
import logging
from typing import Optional, Dict, Any
from enum import Enum
from dotenv import load_dotenv

# Set up logging
logger = logging.getLogger(__name__)

load_dotenv()


class DatabaseState(Enum):
    """Database initialization states"""

    UNINITIALIZED = "uninitialized"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    LOADING_FLOCKMTL = "loading_flockmtl"
    READY = "ready"
    FAILED = "failed"


class DatabaseManager:
    """
    Manages DuckDB connection with proper initialization sequence:
    1. Connection creation
    2. FlockMTL extension loading
    3. Configuration setup
    4. Sample data loading (optional)
    """

    def __init__(self):
        self.conn: Optional[duckdb.DuckDBPyConnection] = None
        self.temp_db_path: Optional[str] = None
        self.temp_dir: Optional[str] = None
        self.flockmtl_enabled = False
        self.state = DatabaseState.UNINITIALIZED
        self._initialization_log: list[str] = []
        self._config: Dict[str, Any] = {}

    def initialize(
        self, max_retries: int = 3, use_memory_fallback: bool = True
    ) -> duckdb.DuckDBPyConnection:
        """
        Initialize database with proper sequence:
        1. Create connection
        2. Load FlockMTL extension
        3. Configure settings
        4. Return ready connection
        """
        logger.info("Starting database initialization...")
        self.state = DatabaseState.CONNECTING

        for attempt in range(max_retries):
            try:
                self._log(f"Initialization attempt {attempt + 1}/{max_retries}")

                # Step 1: Create database connection
                if not self._create_connection(attempt):
                    continue

                # Step 2: Load FlockMTL extension
                self._load_flockmtl_extension()

                # Step 3: Configure database settings
                self._configure_database()

                # Step 4: Finalize setup
                self._finalize_setup()

                self.state = DatabaseState.READY
                self._log("✅ Database initialization completed successfully")
                logger.info(f"Database ready after {attempt + 1} attempt(s)")

                return self.conn

            except Exception as e:
                self._log(f"❌ Attempt {attempt + 1} failed: {e}")
                logger.error(
                    f"Database initialization attempt {attempt + 1} failed",
                    exc_info=True,
                )
                self._cleanup_failed_attempt()

                if attempt < max_retries - 1:
                    time.sleep(1)  # Wait before retry
                    continue
                else:
                    if use_memory_fallback:
                        self._log(
                            "🔄 All attempts failed, falling back to in-memory database"
                        )
                        return self._create_fallback_connection()
                    else:
                        self.state = DatabaseState.FAILED
                        raise Exception(
                            f"Database initialization failed after {max_retries} attempts"
                        )

        # This should not be reached, but just in case
        if use_memory_fallback:
            return self._create_fallback_connection()
        else:
            raise Exception("Database initialization failed")

    def _create_connection(self, attempt: int) -> bool:
        """Step 1: Create database connection"""
        try:
            self._log("Step 1: Creating database connection...")

            # Create unique temporary database to avoid conflicts
            self.temp_dir = tempfile.mkdtemp(prefix=f"flockmtl_{os.getpid()}_")
            self.temp_db_path = os.path.join(self.temp_dir, f"db_{attempt}.db")

            # Connect to temporary database
            self.conn = duckdb.connect(database=self.temp_db_path, read_only=False)

            self.state = DatabaseState.CONNECTED
            self._log(f"✅ Database connection created: {self.temp_db_path}")

            return True

        except Exception as e:
            self._log(f"❌ Failed to create connection: {e}")
            return False

    def _load_flockmtl_extension(self):
        """Step 2: Load FlockMTL extension with proper error handling and storage conflict resolution"""
        self._log("Step 2: Loading FlockMTL extension...")
        self.state = DatabaseState.LOADING_FLOCKMTL

        try:
            # First, try to clean up any existing FlockMTL storage conflicts
            self._cleanup_flockmtl_storage()

            self.conn.execute("INSTALL 'json'; LOAD 'json';")

            # Install FlockMTL extension
            self._log("Installing FlockMTL from community repository...")
            self.conn.execute("FORCE INSTALL flockmtl FROM community;")

            # Configure FlockMTL to use our temporary directory for storage
            self._configure_flockmtl_storage()

            # Load FlockMTL extension
            self._log("Loading FlockMTL extension...")
            self.conn.execute("LOAD flockmtl;")

            # Configure OpenAI API if available
            self._configure_openai_api()

            self.flockmtl_enabled = True
            self._log("✅ FlockMTL extension loaded successfully")

        except Exception as e:
            error_msg = str(e)
            self._log(f"⚠️  FlockMTL extension loading failed: {error_msg}")

            # Check if it's a lock conflict and provide specific guidance
            if "Conflicting lock" in error_msg or "Could not set lock" in error_msg:
                self._handle_flockmtl_lock_conflict(error_msg)

            self.flockmtl_enabled = False
            # Continue without FlockMTL - not a fatal error

    def _configure_openai_api(self):
        """Configure OpenAI API key for FlockMTL"""
        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key or api_key.strip() == "" or api_key == "test-key":
            self._log("⚠️  No valid OpenAI API key found")
            return

        try:
            self._log("Configuring OpenAI API secret...")
            self.conn.execute(f"""
                CREATE SECRET (
                    TYPE OPENAI,
                    API_KEY '{api_key}'
                )
            """)
            self._log("✅ OpenAI API key configured successfully")

        except Exception as e:
            self._log(f"⚠️  Failed to configure OpenAI API: {e}")

    def _configure_database(self):
        """Step 3: Configure database settings"""
        self._log("Step 3: Configuring database settings...")

        try:
            # Configure memory settings for better performance
            self.conn.execute("SET memory_limit = '2GB'")

            # Enable query progress for long-running queries
            self.conn.execute("SET enable_progress_bar = true")

            self._log("✅ Database settings configured")

        except Exception as e:
            self._log(f"⚠️  Some database settings could not be applied: {e}")
            # Continue - configuration failures are not fatal

    def _finalize_setup(self):
        """Step 4: Finalize setup and register cleanup"""
        self._log("Step 4: Finalizing setup...")

        try:
            # Register cleanup handler
            atexit.register(self._cleanup)

            # Test connection with a simple query
            result = self.conn.execute("SELECT 1 as test").fetchone()
            if result[0] != 1:
                raise Exception("Connection test failed")

            self._log("✅ Setup finalized and connection tested")

        except Exception as e:
            self._log(f"❌ Setup finalization failed: {e}")
            raise

    def _cleanup_flockmtl_storage(self):
        """Clean up FlockMTL storage to avoid lock conflicts"""
        try:
            flockmtl_storage_paths = [
                os.path.expanduser("~/.duckdb/flockmtl_storage"),
                os.path.expanduser("~/.local/share/duckdb/flockmtl_storage"),
                # Add other potential FlockMTL storage paths
            ]

            for storage_path in flockmtl_storage_paths:
                if os.path.exists(storage_path):
                    try:
                        # Try to remove the lock file specifically
                        lock_file = os.path.join(storage_path, "flockmtl.db")
                        if os.path.exists(lock_file):
                            os.remove(lock_file)
                            self._log(f"Removed FlockMTL lock file: {lock_file}")

                        # Also try to remove any .lock files
                        for file in os.listdir(storage_path):
                            if file.endswith(".lock") or file.endswith(".wal"):
                                lock_path = os.path.join(storage_path, file)
                                try:
                                    os.remove(lock_path)
                                    self._log(f"Removed lock file: {lock_path}")
                                except Exception:
                                    pass  # Ignore individual file removal failures

                    except PermissionError:
                        self._log(
                            f"Could not clean FlockMTL storage {storage_path} (permission denied)"
                        )
                    except Exception as e:
                        self._log(
                            f"Warning: Could not clean FlockMTL storage {storage_path}: {e}"
                        )

        except Exception as e:
            self._log(f"Warning: FlockMTL storage cleanup failed: {e}")

    def _configure_flockmtl_storage(self):
        """Configure FlockMTL to use a unique storage location for this process"""
        try:
            # Create a unique FlockMTL storage directory for this process
            flockmtl_storage_dir = os.path.join(self.temp_dir, "flockmtl_storage")
            os.makedirs(flockmtl_storage_dir, exist_ok=True)

            self._log(f"Creating isolated FlockMTL storage: {flockmtl_storage_dir}")

            # Set environment variables to override FlockMTL storage location
            os.environ["FLOCKMTL_STORAGE_PATH"] = flockmtl_storage_dir
            os.environ["DUCKDB_FLOCKMTL_STORAGE"] = flockmtl_storage_dir

            # Try to configure FlockMTL storage path using SQL if the extension supports it
            try:
                # Use a pragma or setting if available
                self.conn.execute(
                    f"PRAGMA flockmtl_storage_path = '{flockmtl_storage_dir}';"
                )
                self._log("FlockMTL storage configured via PRAGMA")
            except Exception:
                try:
                    # Alternative: Use a SET statement if supported
                    self.conn.execute(
                        f"SET GLOBAL flockmtl_storage_path = '{flockmtl_storage_dir}';"
                    )
                    self._log("FlockMTL storage configured via SET GLOBAL")
                except Exception:
                    # If SQL configuration fails, environment variable should work
                    self._log("FlockMTL storage configured via environment variables")

        except Exception as e:
            self._log(f"Warning: Could not configure FlockMTL storage: {e}")
            # This is not fatal - FlockMTL will use default location

    def _handle_flockmtl_lock_conflict(self, error_msg: str):
        """Handle FlockMTL lock conflicts with specific guidance"""
        self._log("🔒 FlockMTL lock conflict detected!")

        # Extract PID if available from error message
        import re

        pid_match = re.search(r"PID (\d+)", error_msg)
        if pid_match:
            conflicting_pid = pid_match.group(1)
            self._log(f"Conflicting process PID: {conflicting_pid}")

            # Check if the process is still running
            try:
                import psutil

                if psutil.pid_exists(int(conflicting_pid)):
                    process = psutil.Process(int(conflicting_pid))
                    self._log(f"Conflicting process is still running: {process.name()}")
                    self._log(
                        "💡 Suggestion: Stop the other FlockMTL process or wait for it to finish"
                    )
                else:
                    self._log(
                        "Conflicting process no longer exists - attempting cleanup..."
                    )
                    self._cleanup_flockmtl_storage()
            except ImportError:
                self._log("Install psutil for better process conflict detection")
            except Exception as e:
                self._log(f"Could not check conflicting process: {e}")

        self._log("📖 FlockMTL will be disabled for this session")
        self._log(
            "🔧 To resolve: Stop other FlockMTL processes or restart your development environment"
        )

    def _create_fallback_connection(self) -> duckdb.DuckDBPyConnection:
        """Create fallback in-memory connection when initialization fails"""
        try:
            self._log("Creating fallback in-memory database...")
            self._cleanup_failed_attempt()

            self.conn = duckdb.connect(database=":memory:", read_only=False)
            self.state = DatabaseState.READY
            self.flockmtl_enabled = False

            self._log("✅ Fallback in-memory database created")
            logger.warning("Using fallback in-memory database without FlockMTL")

            return self.conn

        except Exception as e:
            self._log(f"❌ Even fallback connection failed: {e}")
            self.state = DatabaseState.FAILED
            logger.error(
                "Critical: Even fallback database connection failed", exc_info=True
            )
            raise e

    def _cleanup_failed_attempt(self):
        """Clean up resources from a failed initialization attempt"""
        try:
            if self.conn:
                self.conn.close()
                self.conn = None

            if self.temp_db_path and os.path.exists(self.temp_db_path):
                os.remove(self.temp_db_path)

            if self.temp_dir and os.path.exists(self.temp_dir):
                # Also clean up any FlockMTL storage in this temp directory
                flockmtl_storage = os.path.join(self.temp_dir, "flockmtl_storage")
                if os.path.exists(flockmtl_storage):
                    try:
                        import shutil

                        shutil.rmtree(flockmtl_storage)
                        self._log(f"Cleaned up FlockMTL storage: {flockmtl_storage}")
                    except Exception:
                        pass

                os.rmdir(self.temp_dir)

            self.temp_db_path = None
            self.temp_dir = None

        except Exception as e:
            self._log(f"Warning: Cleanup partially failed: {e}")

    def _cleanup(self):
        """Final cleanup on application exit"""
        try:
            self._log("Performing final cleanup...")

            # Clean up our isolated FlockMTL storage
            if hasattr(self, "temp_dir") and self.temp_dir:
                flockmtl_storage = os.path.join(self.temp_dir, "flockmtl_storage")
                if os.path.exists(flockmtl_storage):
                    try:
                        import shutil

                        shutil.rmtree(flockmtl_storage)
                        self._log("Cleaned up isolated FlockMTL storage")
                    except Exception:
                        pass

            self._cleanup_failed_attempt()
            self.state = DatabaseState.UNINITIALIZED

        except Exception as e:
            logger.error(f"Error during final cleanup: {e}")

    def _log(self, message: str):
        """Add message to initialization log"""
        self._initialization_log.append(f"[{time.strftime('%H:%M:%S')}] {message}")
        print(message)  # Also print for immediate feedback

    # Public methods for status and information
    def is_flockmtl_enabled(self) -> bool:
        """Check if FlockMTL extension is available"""
        return self.flockmtl_enabled

    def get_state(self) -> DatabaseState:
        """Get current database state"""
        return self.state

    def is_ready(self) -> bool:
        """Check if database is ready for queries"""
        return self.state == DatabaseState.READY and self.conn is not None

    def get_initialization_log(self) -> list[str]:
        """Get initialization log for debugging"""
        return self._initialization_log.copy()

    def get_connection_info(self) -> Dict[str, Any]:
        """Get detailed connection information"""
        return {
            "state": self.state.value,
            "flockmtl_enabled": self.flockmtl_enabled,
            "connection_active": self.conn is not None,
            "temp_db_path": self.temp_db_path,
            "initialization_log": self._initialization_log[-5:],  # Last 5 entries
        }


# Create global database manager with improved initialization
db_manager = DatabaseManager()

# Initialize database connection
try:
    conn = db_manager.initialize()
    logger.info("Database manager initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize database manager: {e}")
    # Create a minimal fallback connection for testing
    conn = duckdb.connect(database=":memory:", read_only=False)
    logger.warning("Using minimal fallback connection")


def get_connection() -> duckdb.DuckDBPyConnection:
    """
    Get the database connection

    Returns:
        DuckDB connection instance

    Raises:
        RuntimeError: If connection is not available or not ready
    """
    if not db_manager.is_ready():
        raise RuntimeError(
            f"Database not ready. Current state: {db_manager.get_state().value}"
        )

    return conn


def is_flockmtl_available() -> bool:
    """
    Check if FlockMTL extension is available and loaded

    Returns:
        True if FlockMTL is available, False otherwise
    """
    return db_manager.is_flockmtl_enabled()


def get_database_info() -> Dict[str, Any]:
    """
    Get comprehensive database status information

    Returns:
        Dictionary with database state, capabilities, and diagnostics
    """
    return {
        "manager_info": db_manager.get_connection_info(),
        "flockmtl_available": is_flockmtl_available(),
        "connection_ready": db_manager.is_ready(),
        "has_openai_key": bool(
            os.getenv("OPENAI_API_KEY")
            and os.getenv("OPENAI_API_KEY").strip() != "test-key"
        ),
    }


def reset_database() -> duckdb.DuckDBPyConnection:
    """
    Reset database connection (useful for testing or recovery)

    Returns:
        New database connection
    """
    global conn, db_manager

    try:
        # Clean up current connection
        db_manager._cleanup()

        # Create new manager and initialize
        db_manager = DatabaseManager()
        conn = db_manager.initialize()

        logger.info("Database connection reset successfully")
        return conn

    except Exception as e:
        logger.error(f"Database reset failed: {e}")
        raise
