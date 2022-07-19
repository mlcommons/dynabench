from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()


DB_HOST=os.getenv('DB_HOST')
DB_PORT=os.getenv('DB_PORT')
DB_NAME=os.getenv('DB_NAME')
DB_USER=os.getenv('DB_USER')
DB_PASSWORD=os.getenv('DB_PASSWORD')
CONNECTION_URI = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"


class Connection:
    def __init__(self)-> None:
        self.engine = create_engine(CONNECTION_URI, echo = False, pool_recycle = 3600)
        self.Session = sessionmaker(bind = self.engine, expire_on_commit= False)
        self.session = self.Session()
        self.metadata = MetaData()
    
    def refresh_session(self):
        self.session = self.Session()
    
    def close_session(self):
        self.session.close()