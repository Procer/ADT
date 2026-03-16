
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

async function fixAdmin() {
    const ds = new DataSource({
        type: "mssql",
        host: "localhost",
        port: 1433,
        username: "sa",
        password: "YourPassword123",
        database: "adt_db",
        options: { encrypt: false, trustServerCertificate: true }
    });

    try {
        await ds.initialize();
        console.log("Conectado a la base de datos para reparación...");

        // Buscamos si existe el usuario
        const users = await ds.query("SELECT id, email, role FROM users WHERE email = 'admin@adt.com'");
        
        if (users.length > 0) {
            console.log("Usuario encontrado. Rol actual:", users[0].role);
            await ds.query("UPDATE users SET role = 'SUPER_ADMIN', tenant_id = NULL WHERE email = 'admin@adt.com'");
            console.log("¡ÉXITO! El usuario admin@adt.com ahora es SUPER_ADMIN.");
        } else {
            console.log("Usuario no encontrado. Creando Super Admin maestro...");
            const hash = await bcrypt.hash('admin123', 10);
            await ds.query(`INSERT INTO users (id, email, password_hash, nombre_completo, role, created_at) 
                           VALUES (NEWID(), 'admin@adt.com', '${hash}', 'Super Administrador ADT', 'SUPER_ADMIN', GETDATE())`);
            console.log("¡ÉXITO! Se ha creado un nuevo Super Admin maestro.");
        }
    } catch (err) {
        console.error("Error en reparación:", err);
    } finally {
        await ds.destroy();
    }
}

fixAdmin();
