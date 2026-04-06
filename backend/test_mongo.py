import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_mongo():
    # Load .env
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("❌ Error: MONGODB_URI not found in .env file.")
        return

    print(f"Connecting to MongoDB...")
    try:
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth.
        await client.admin.command('ismaster')
        print("✅ Success: Successfully connected to MongoDB Atlas!")
        
        db = client.studify_db
        collections = await db.list_collection_names()
        print(f"📂 Available Collections in 'studify_db': {collections}")
        
        if 'quizzes' in collections:
            count = await db.quizzes.count_documents({})
            print(f"📝 Total Quizzes saved: {count}")
        else:
            print("ℹ️ Note: 'quizzes' collection hasn't been created yet. It will appear after you generate your first quiz.")
            
    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_mongo())
