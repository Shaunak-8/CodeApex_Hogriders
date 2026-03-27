from db.db import engine
from sqlalchemy import text

def fix_enums():
    print("🛠 Fixing PG Enums in Neon...")
    with engine.connect() as conn:
        # Add labels to runstatusenum
        try:
            conn.execute(text("ALTER TYPE runstatusenum ADD VALUE IF NOT EXISTS 'passed'"))
            conn.execute(text("ALTER TYPE runstatusenum ADD VALUE IF NOT EXISTS 'fail'"))
            conn.execute(text("ALTER TYPE runstatusenum ADD VALUE IF NOT EXISTS 'pass'"))
            print("✅ runstatusenum updated.")
        except Exception as e:
            print(f"⚠️ runstatusenum update note: {e}")
            
        # Add labels to iterationstatusenum
        try:
            conn.execute(text("ALTER TYPE iterationstatusenum ADD VALUE IF NOT EXISTS 'passed'"))
            conn.execute(text("ALTER TYPE iterationstatusenum ADD VALUE IF NOT EXISTS 'failed'"))
            conn.execute(text("ALTER TYPE iterationstatusenum ADD VALUE IF NOT EXISTS 'fail'"))
            conn.execute(text("ALTER TYPE iterationstatusenum ADD VALUE IF NOT EXISTS 'pass'"))
            print("✅ iterationstatusenum updated.")
        except Exception as e:
            print(f"⚠️ iterationstatusenum update note: {e}")
            
        conn.commit()

if __name__ == "__main__":
    fix_enums()
