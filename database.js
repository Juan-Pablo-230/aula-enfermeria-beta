const { MongoClient, ServerApiVersion } = require('mongodb');

class MongoDB {
  constructor() {
    this.client = null;
    this.logsClient = null;
    this.db = null;
    this.isConnected = false;
    this.isLogsConnected = false;
    this.connectionAttempts = 0;
  }

  async connect() {
    try {
      this.connectionAttempts++;
      console.log(`🔄 Intento de conexión #${this.connectionAttempts}`);
      
      const uri = process.env.MONGODB_URI;
      
      // DEBUG: Mostrar información de la URI
      console.log('=== MONGODB CONNECTION DEBUG ===');
      console.log('URI defined:', !!uri);
      console.log('URI length:', uri ? uri.length : 0);
      
      if (uri) {
        // Mostrar URI enmascarada para seguridad
        const maskedURI = uri.replace(
          /mongodb\+srv:\/\/[^:]+:[^@]+@/, 
          'mongodb+srv://***:***@'
        );
        console.log('Masked URI:', maskedURI);
      }
      
      if (!uri) {
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }
      
      // Validar formato básico
      if (!uri.startsWith('mongodb+srv://')) {
        throw new Error('URI debe comenzar con mongodb+srv://');
      }

      console.log('🔌 Conectando a MongoDB Atlas...');
      
      this.client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });

      console.log('⏳ Estableciendo conexión...');
      await this.client.connect();
      
      // Verificar conexión con ping
      await this.client.db().admin().command({ ping: 1 });
      
      this.isConnected = true;
      console.log('✅ Conectado a MongoDB Atlas correctamente');
      
      // Listar bases de datos disponibles
      const databases = await this.client.db().admin().listDatabases();
      console.log('📊 Bases de datos disponibles:', databases.databases.map(db => db.name));
      
      // Conectar a la base de logs si existe la variable
      if (process.env.MONGODB_URI_LOGS) {
        await this.connectLogsDatabase();
      } else {
        console.log('ℹ️ MONGODB_URI_LOGS no definida, omitiendo conexión a logs');
      }
      
      return this.client;
      
    } catch (error) {
      console.error('❌ ERROR conectando a MongoDB Atlas:');
      console.error('- Message:', error.message);
      console.error('- Error code:', error.code || 'N/A');
      console.error('- Error name:', error.name);
      
      // Información adicional según el tipo de error
      if (error.message.includes('authentication')) {
        console.error('⚠️ Error de autenticación - Verifica usuario/contraseña');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        console.error('⚠️ Error de DNS - Verifica el hostname del cluster');
      } else if (error.message.includes('timed out')) {
        console.error('⚠️ Timeout - Verifica Network Access en MongoDB Atlas');
      } else if (error.message.includes('bad auth')) {
        console.error('⚠️ Credenciales incorrectas - Verifica usuario y contraseña');
      }
      
      this.isConnected = false;
      throw error;
    }
  }

  async connectLogsDatabase() {
    try {
      const logsUri = process.env.MONGODB_URI_LOGS;
      
      if (!logsUri) {
        console.log('ℹ️ MONGODB_URI_LOGS no definida');
        return;
      }
      
      console.log('🔌 Conectando a MongoDB Atlas (LOGS)...');
      
      this.logsClient = new MongoClient(logsUri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        maxPoolSize: 5,  // Pool más pequeño para logs
        minPoolSize: 1,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });
      
      await this.logsClient.connect();
      await this.logsClient.db().admin().command({ ping: 1 });
      
      this.isLogsConnected = true;
      console.log('✅ Conectado a MongoDB Atlas (LOGS) correctamente');
      
    } catch (error) {
      console.error('❌ ERROR conectando a MongoDB Logs:');
      console.error('- Message:', error.message);
      this.isLogsConnected = false;
      // No lanzamos error para no afectar la conexión principal
    }
  }

  // Método seguro que intenta reconectar si es necesario
  async getDatabaseSafe(dbName) {
    if (!this.isConnected) {
      console.warn('⚠️ No conectado, intentando reconectar automáticamente...');
      try {
        await this.connect();
      } catch (error) {
        console.error('❌ No se pudo reconectar:', error.message);
        throw new Error('No hay conexión a la base de datos');
      }
    }
    
    return this.client.db(dbName);
  }

  // Método para obtener la base de datos de logs
  async getLogsDatabaseSafe(dbName) {
    if (!this.isLogsConnected) {
      console.warn('⚠️ Logs no conectado, intentando reconectar...');
      try {
        await this.connectLogsDatabase();
      } catch (error) {
        console.error('❌ No se pudo reconectar a logs:', error.message);
        throw new Error('No hay conexión a la base de datos de logs');
      }
    }
    
    // Usar la base de datos especificada o la de la URI
    return this.logsClient.db(dbName || 'aula-enfermeria-logs');
  }

  // Método original (mantener compatibilidad)
  getDatabase(dbName) {
    if (!this.isConnected) {
      throw new Error('No hay conexión a la base de datos');
    }
    return this.client.db(dbName);
  }

  // Métodos específicos para tus bases de datos
  getUsuariosDB() {
    return this.getDatabaseSafe('usuario');
  }

  getFormulariosDB() {
    return this.getDatabaseSafe('formulario');
  }

  getMaterialDB() {
    return this.getDatabaseSafe('material');
  }

  // Nuevo: Método específico para logs
  getLogsDB() {
    return this.getLogsDatabaseSafe('aula-enfermeria-logs');
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('🔌 Conexión a MongoDB (principal) cerrada');
    }
    if (this.logsClient) {
      await this.logsClient.close();
      this.isLogsConnected = false;
      console.log('🔌 Conexión a MongoDB (logs) cerrada');
    }
  }
}

const mongoDB = new MongoDB();

// NOTA: Eliminamos la auto-conexión al iniciar para Vercel
// La conexión se realizará en cada función serverless bajo demanda

process.on('SIGINT', async () => {
  await mongoDB.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoDB.close();
  process.exit(0);
});

module.exports = {
  connectToDatabase: () => mongoDB.connect(),
  getDB: (dbName) => mongoDB.getDatabaseSafe(dbName),
  getUsuariosDB: () => mongoDB.getUsuariosDB(),
  getFormulariosDB: () => mongoDB.getFormulariosDB(),
  getMaterialDB: () => mongoDB.getMaterialDB(),
  getLogsDB: () => mongoDB.getLogsDB(),
  mongoDB
};