import asyncio
import copy
import logging
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

logger = logging.getLogger("rehabsense.database")

class InMemoryCollection:
    def __init__(self, name: str):
        self.name = name
        self.documents: List[Dict[str, Any]] = []

    async def find_one(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self.documents:
            if self._matches(doc, filter_query):
                return copy.deepcopy(doc)
        return None

    def find(self, filter_query: Optional[Dict[str, Any]] = None):
        filter_query = filter_query or {}
        matches = [copy.deepcopy(doc) for doc in self.documents if self._matches(doc, filter_query)]
        return InMemoryCursor(matches)

    async def insert_one(self, document: Dict[str, Any]):
        doc_copy = copy.deepcopy(document)
        self.documents.append(doc_copy)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc_copy.get("id") or doc_copy.get("_id"))

    async def update_one(self, filter_query: Dict[str, Any], update_query: Dict[str, Any]):
        matched_count = 0
        modified_count = 0
        set_fields = update_query.get("$set", {})

        for doc in self.documents:
            if self._matches(doc, filter_query):
                matched_count += 1
                for key, val in set_fields.items():
                    doc[key] = copy.deepcopy(val)
                modified_count += 1
                break

        class UpdateResult:
            def __init__(self, m_count, mod_count):
                self.matched_count = m_count
                self.modified_count = mod_count
        return UpdateResult(matched_count, modified_count)

    async def delete_one(self, filter_query: Dict[str, Any]):
        for i, doc in enumerate(self.documents):
            if self._matches(doc, filter_query):
                self.documents.pop(i)
                break

    async def count_documents(self, filter_query: Dict[str, Any]) -> int:
        count = 0
        for doc in self.documents:
            if self._matches(doc, filter_query):
                count += 1
        return count

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, subq) for subq in v):
                    return False
            elif doc.get(k) != v:
                return False
        return True

class InMemoryCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self.items = items

    def sort(self, key_or_list, direction=None):
        if isinstance(key_or_list, str):
            reverse = direction == -1
            self.items.sort(key=lambda x: x.get(key_or_list, ""), reverse=reverse)
        elif isinstance(key_or_list, list) and len(key_or_list) > 0:
            key, d = key_or_list[0]
            reverse = d == -1
            self.items.sort(key=lambda x: x.get(key, ""), reverse=reverse)
        return self

    def limit(self, count: int):
        self.items = self.items[:count]
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        if length is not None:
            return self.items[:length]
        return self.items

    def __aiter__(self):
        self._iter = iter(self.items)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration

def sanitize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return doc
    clean = copy.deepcopy(doc)
    if "_id" in clean:
        if "id" not in clean:
            clean["id"] = str(clean["_id"])
        clean.pop("_id", None)
    return clean

class MongoCollectionWrapper:
    def __init__(self, collection):
        self.collection = collection

    async def find_one(self, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one(filter_query)
        return sanitize_doc(doc)

    def find(self, filter_query: Optional[Dict[str, Any]] = None):
        filter_query = filter_query or {}
        cursor = self.collection.find(filter_query)
        return MongoCursorWrapper(cursor)

    async def insert_one(self, document: Dict[str, Any]):
        return await self.collection.insert_one(document)

    async def update_one(self, filter_query: Dict[str, Any], update_query: Dict[str, Any]):
        return await self.collection.update_one(filter_query, update_query)

    async def delete_one(self, filter_query: Dict[str, Any]):
        return await self.collection.delete_one(filter_query)

    async def delete_many(self, filter_query: Dict[str, Any]):
        return await self.collection.delete_many(filter_query)

    async def count_documents(self, filter_query: Dict[str, Any]) -> int:
        return await self.collection.count_documents(filter_query)

class MongoCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def sort(self, *args, **kwargs):
        self.cursor = self.cursor.sort(*args, **kwargs)
        return self

    def limit(self, count: int):
        self.cursor = self.cursor.limit(count)
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        raw_list = await self.cursor.to_list(length=length)
        return [sanitize_doc(d) for d in raw_list]

class DatabaseManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Any = None
        self.is_in_memory: bool = False
        self.in_memory_collections: Dict[str, InMemoryCollection] = {}

    async def connect(self):
        if settings.FORCE_IN_MEMORY_DB:
            logger.info("FORCE_IN_MEMORY_DB is enabled. Using in-memory fallback storage.")
            self.is_in_memory = True
            return

        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=1500
            )
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_in_memory = False
            logger.info(f"Connected successfully to MongoDB at {settings.MONGODB_URI}/{settings.DATABASE_NAME}")
        except Exception as e:
            logger.warning(f"MongoDB offline or unavailable ({e}). Seamlessly engaging in-memory fallback store.")
            self.is_in_memory = True

    def get_collection(self, name: str):
        if self.is_in_memory or self.db is None:
            if name not in self.in_memory_collections:
                self.in_memory_collections[name] = InMemoryCollection(name)
            return self.in_memory_collections[name]
        return MongoCollectionWrapper(self.db[name])

db_manager = DatabaseManager()

def get_db_collection(name: str):
    return db_manager.get_collection(name)
