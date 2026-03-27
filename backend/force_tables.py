from db.db import engine, Base
from db.models import User, Project, Run, Iteration, Fix, Issue, Task

print("🚀 Forcing table creation in Neon...")
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")
except Exception as e:
    print(f"❌ Error creating tables: {e}")
