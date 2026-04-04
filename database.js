const { MongoClient, ServerApiVersion } = require('mongodb');

class MongoDB {
  constructor() {
    this.client = null;
    this.logsClient = null;
    this.isConnected = false;
    this.isLogsConnected = false;
    this.connectionAttempts = 0;
    this.connectionPromise = null;
    this.logsConnectionPromise = null;
  }

  async connect() {
    // Si ya hay una conexión activa, reutilizarla
    if (this.isConnected && this.client) {
      console.log('♻️ Reutilizando conexión principal existente');
      return this.client;
    }

    // Si ya hay una promesa de conexión en curso, esperarla
    if (this.connectionPromise) {
      console.log('⏳ Esperando conexión principal en curso...');
      return this.connectionPromise;
    }

    this.connectionPromise = this._doConnect();
    return this.connectionPromise;
  }

  async _doConnect() {
    try {
      this.connectionAttempts++;
      console.log(`🔄 Intento de conexión #${this.connectionAttempts}`);
      
      const uri = process.env.MONGODB_URI;
      
      if (!uri) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }

      console.log('🔌 Conectando a MongoDB Atlas (principal)...');
      
      this.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 1, // Reducido para serverless
        minPoolSize: 1,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxIdleTimeMS: 60000, // Cerrar conexiones inactivas después de 60s
      });

      await this.client.connect();
      await this.client.db().admin().command({ ping: 1 });
      
      this.isConnected = true;
      console.log('✅ Conectado a MongoDB Atlas correctamente');
      
      // Conectar a logs si existe la variable
      if (process.env.MONGODB_URI_LOGS) {
        // No esperar a que se conecte logs, hacerlo en paralelo
        this.connectLogsDatabase().catch(e => console.warn('Logs connection warning:', e.message));
      }
      
      return this.client;
      
    } catch (error) {
      console.error('❌ ERROR conectando a MongoDB Atlas:', error.message);
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  async connectLogsDatabase() {
    // Si ya hay conexión activa, reutilizar
    if (this.isLogsConnected && this.logsClient) {
      console.log('♻️ Reutilizando conexión de logs existente');
      return this.logsClient;
    }

    // Si ya hay una promesa en curso, esperarla
    if (this.logsConnectionPromise) {
      console.log('⏳ Esperando conexión de logs en curso...');
      return this.logsConnectionPromise;
    }

    this.logsConnectionPromise = this._doConnectLogs();
    return this.logsConnectionPromise;
  }

  async _doConnectLogs() {
    try {
      const logsUri = process.env.MONGODB_URI_LOGS;
      
      if (!logsUri) {
        console.log('ℹ️ MONGODB_URI_LOGS no definida');
        this.logsConnectionPromise = null;
        return null;
      }
      
      console.log('🔌 Conectando a MongoDB Atlas (LOGS)...');
      
      this.logsClient = new MongoClient(logsUri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 1, // Reducido para serverless
        minPoolSize: 1,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxIdleTimeMS: 60000,
      });
      
      await this.logsClient.connect();
      await this.logsClient.db().admin().command({ ping: 1 });
      
      this.isLogsConnected = true;
      console.log('✅ Conectado a MongoDB Atlas (LOGS) correctamente');
      
      return this.logsClient;
      
    } catch (error) {
      console.error('❌ ERROR conectando a MongoDB Logs:', error.message);
      this.isLogsConnected = false;
      this.logsConnectionPromise = null;
      // No lanzamos error para no afectar la conexión principal
      return null;
    }
  }

  async getDatabaseSafe(dbName) {
    // Asegurar que la conexión está activa
    if (!this.isConnected || !this.client) {
      console.log('🔄 Reconectando base principal...');
      await this.connect();
    }
    
    // Verificar que la conexión sigue viva
    try {
      await this.client.db().admin().command({ ping: 1 });
    } catch (error) {
      console.warn('⚠️ Conexión principal caída, reconectando...');
      this.isConnected = false;
      this.connectionPromise = null;
      await this.connect();
    }
    
    return this.client.db(dbName);
  }

  async getLogsDatabaseSafe() {
    // Si no hay URI de logs, usar la principal como fallback
    if (!process.env.MONGODB_URI_LOGS) {
      console.log('⚠️ Usando base principal para logs (fallback)');
      return this.getDatabaseSafe('aula-enfermeria');
    }
    
    // Asegurar conexión de logs
    if (!this.isLogsConnected || !this.logsClient) {
      console.log('🔄 Reconectando base de logs...');
      await this.connectLogsDatabase();
    }
    
    // Verificar que la conexión sigue viva
    if (this.logsClient) {
      try {
        await this.logsClient.db().admin().command({ ping: 1 });
      } catch (error) {
        console.warn('⚠️ Conexión de logs caída, reconectando...');
        this.isLogsConnected = false;
        this.logsConnectionPromise = null;
        await this.connectLogsDatabase();
      }
    }
    
    return this.logsClient ? this.logsClient.db('aula-enfermeria-logs') : this.getDatabaseSafe('aula-enfermeria');
  }

  getDatabase(dbName) {
    if (!this.isConnected) {
      throw new Error('No hay conexión a la base de datos');
    }
    return this.client.db(dbName);
  }

  getUsuariosDB() {
    return this.getDatabaseSafe('usuario');
  }

  getFormulariosDB() {
    return this.getDatabaseSafe('formulario');
  }

  getMaterialDB() {
    return this.getDatabaseSafe('material');
  }

  getLogsDB() {
    return this.getLogsDatabaseSafe();
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      console.log('🔌 Conexión a MongoDB (principal) cerrada');
    }
    if (this.logsClient) {
      await this.logsClient.close();
      this.isLogsConnected = false;
      this.logsClient = null;
      console.log('🔌 Conexión a MongoDB (logs) cerrada');
    }
    this.connectionPromise = null;
    this.logsConnectionPromise = null;
  }
}

const mongoDB = new MongoDB();

module.exports = {
  connectToDatabase: () => mongoDB.connect(),
  getDB: (dbName) => mongoDB.getDatabaseSafe(dbName),
  getUsuariosDB: () => mongoDB.getUsuariosDB(),
  getFormulariosDB: () => mongoDB.getFormulariosDB(),
  getMaterialDB: () => mongoDB.getMaterialDB(),
  getLogsDB: () => mongoDB.getLogsDB(),
  mongoDB
};